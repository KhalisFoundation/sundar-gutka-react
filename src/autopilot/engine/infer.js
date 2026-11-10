// Phone inference for Autopilot: the desktop engine's infer.js with onnxruntime-react-native in
// place of onnxruntime-node. Same model, same inputs, same greedy decode, so the follower sees
// the same heard text it sees on the desktop.
const pace = require("./pace");
const VOCAB = require("./vocab");

const SR = 16000;
const BLANK = 256;

function resampleTo16k(pcm, inSr) {
  if (inSr === SR) return pcm;
  const n = Math.round((pcm.length * SR) / inSr);
  if (n <= 0) return new Float32Array(0);
  const out = new Float32Array(n);
  const last = pcm.length - 1;
  for (let k = 0; k < n; k += 1) {
    const x = (k * pcm.length) / n;
    if (x <= 0) out[k] = pcm[0];
    else if (x >= last) out[k] = pcm[last];
    else {
      const i0 = Math.floor(x);
      const frac = x - i0;
      out[k] = pcm[i0] * (1 - frac) + pcm[i0 + 1] * frac;
    }
  }
  return out;
}

class Infer {
  constructor(sess, ort) {
    this.sess = sess;
    this.ort = ort;
    this.vocab = VOCAB;
    this.lastMs = 0; // wall ms of the last model pass
  }

  static async create(modelPath) {
    const ort = require("onnxruntime-react-native"); // eslint-disable-line global-require
    // Android: two threads halve each pass on mid-range phones (emulator 235 -> 122 ms per 4 s
    // window), so they listen every 0.25 s instead of 0.5 s. iPhones already take ~0.09 s on one
    // core; a second thread there would only add battery use.
    const { Platform } = require("react-native"); // eslint-disable-line global-require
    const sess = await ort.InferenceSession.create(modelPath, {
      intraOpNumThreads: Platform.OS === "android" ? 2 : 1,
      interOpNumThreads: 1,
      enableCpuMemArena: false, // no pooled buffers kept between passes: far less memory held
      enableMemPattern: false,
    });
    return new Infer(sess, ort);
  }

  async emissions(buf) {
    const t0 = Date.now();
    const { Tensor } = this.ort;
    const out = await this.sess.run({
      audio: new Tensor("float32", buf, [1, buf.length]),
      // eslint-disable-next-line no-undef
      audio_len: new Tensor("int64", BigInt64Array.from([BigInt(buf.length)]), [1]),
    });
    this.lastMs = Date.now() - t0;
    pace.notePass(this.lastMs);
    const lp = out.log_probs;
    return { data: lp.data, frames: Number(out.out_len.data[0]), C: lp.dims[2] };
  }

  release() {
    return this.sess.release();
  }

  // eslint-disable-next-line class-methods-use-this
  greedy({ data, frames, C }) {
    const ids = [];
    let prev = -1;
    for (let t = 0; t < frames; t += 1) {
      let best = 0;
      let bestv = -Infinity;
      const off = t * C;
      for (let c = 0; c < C; c += 1) {
        if (data[off + c] > bestv) {
          bestv = data[off + c];
          best = c;
        }
      }
      if (best !== prev && best !== BLANK) ids.push(best);
      prev = best;
    }
    return ids;
  }

  decode(ids) {
    const s = ids.map((id) => this.vocab[id]).join("");
    return s.replace(/▁/g, " ").trim();
  }
}

module.exports = { Infer, resampleTo16k, SR, BLANK };
