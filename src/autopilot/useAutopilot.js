// Autopilot: listens while a Bani is read or sung and keeps its current pangti on screen.
// The follower is the desktop STTM engine's Bani follower, unchanged (engine/follower.js, a copy of its follower2.js). It
// compares what it hears with the pangtis exactly as the database gives them and answers with a
// row of this Bani; the reader only scrolls to that row. Nothing is written to the database, and
// audio never leaves the phone.
import { useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import RNFS from "react-native-fs";
import { useSelector } from "react-redux";
import { activateKeepAwake, deactivateKeepAwake } from "@sayem314/react-native-keep-awake";
import { logError } from "@common";
import autopilotText from "./autopilotText";

// The STTM desktop speech model (int8), fetched once on first use, pinned by revision and size.
const MODEL_URL =
  "https://huggingface.co/karansea/indicconformer-stt-pa-ctc-shabad-preview/resolve/5fd2e89e3a43d31f47b0fb55fdce5ed50a91283f/model.int8.onnx";
const MODEL_BYTES = 184311219;
const MODEL_SHA256 = "5f9e41d867dee2883796e290eef85abc11cbd32fe0f10c1f763a638d824634f9";
// iOS: Caches, so it is never in the user's iCloud backup. Android: the app's own files (backup is off
// there), which the system does not purge the way it clears caches on a full phone.
const MODEL_DIR = Platform.OS === "ios" ? RNFS.CachesDirectoryPath : RNFS.DocumentDirectoryPath;
const MODEL_PATH = `${MODEL_DIR}/autopilot-model.int8.onnx`;
const SR = 16000;
const MAX_BACKLOG = SR; // never fall more than 1 s behind the room
const SILENT_S = 4; // this long with no sound at all: the microphone is off or blocked

// Phone Paath profile: talk (English, announcements) heard as short Gurmukhi fragments must never move
// the highlight. A window has to hear at least 7 letters and match at least 0.45 per letter to count:
// 0 of 178 English windows pass (40 did before), Paath right-pangti time 98.7% -> 98.3%, lag unchanged.
const PAATH = { minHyp: 7, minScore: 0.45 };

let inferPromise = null; // the model session while Autopilot is on
let download = null; // { promise, cancel, onProgress } while the model is downloading

export const modelReady = async () =>
  (await RNFS.exists(MODEL_PATH)) && (await RNFS.stat(MODEL_PATH)).size === MODEL_BYTES;

const ensureModel = async (onProgress) => {
  if (await modelReady()) return;
  if (!download) {
    // Partial files of attempts the app or phone ended are cleared before a new one.
    const old = await RNFS.readDir(MODEL_DIR).catch(() => []);
    await Promise.all(
      old
        .filter((f) => f.name.startsWith("autopilot-model") && f.name.endsWith(".part"))
        .map((f) => RNFS.unlink(f.path).catch(() => {}))
    );
  }
  if (!download) {
    const tmp = `${MODEL_PATH}.${Date.now()}.part`; // each attempt its own file
    const job = RNFS.downloadFile({
      fromUrl: MODEL_URL,
      toFile: tmp,
      progressInterval: 500,
      progress: ({ bytesWritten }) => d.onProgress(bytesWritten / MODEL_BYTES), // eslint-disable-line no-use-before-define
    });
    let cancel;
    // Cancelling settles this attempt here: on iOS a stopped download may never settle by itself.
    const cancelled = new Promise((_, reject) => {
      cancel = () => reject(new Error("model download cancelled"));
    });
    const d = { onProgress };
    d.cancel = () => {
      RNFS.stopDownload(job.jobId);
      cancel();
    };
    d.promise = Promise.race([
      job.promise.then(async ({ statusCode }) => {
        const ok =
          statusCode === 200 &&
          (await RNFS.stat(tmp)).size === MODEL_BYTES &&
          (await RNFS.hash(tmp, "sha256")) === MODEL_SHA256; // once, after download
        if (!ok) throw new Error(`model download failed (${statusCode})`);
        await RNFS.moveFile(tmp, MODEL_PATH);
      }),
      cancelled,
    ])
      .catch(async (e) => {
        await RNFS.unlink(tmp).catch(() => {});
        throw e;
      })
      .finally(() => {
        if (download === d) download = null;
      });
    download = d;
  }
  download.onProgress = onProgress;
  await download.promise;
};

// Asked before Autopilot switches on: on Android the permission dialog pauses the app, which reads as
// going to the background and would otherwise switch Autopilot straight off again.
// Inside the running effect only checked (never asked again: a second dialog would pause the app).
const micGranted = async () =>
  Platform.OS !== "android" ||
  PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);

export const micAllowed = async () => {
  if (Platform.OS !== "android") return true; // iOS asks on first recording; silence is caught below
  const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  return r === PermissionsAndroid.RESULTS.GRANTED;
};

// base64 PCM16 mono -> Float32, and whether any sample was not silent
const toFloat = (b64) => {
  const bin = global.atob(b64);
  const n = bin.length >> 1; // eslint-disable-line no-bitwise
  const out = new Float32Array(n);
  let sound = false;
  for (let i = 0; i < n; i += 1) {
    let v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); // eslint-disable-line no-bitwise
    if (v >= 0x8000) v -= 0x10000;
    if (v !== 0) sound = true;
    out[i] = v / 32768;
  }
  return { pcm: out, sound };
};

// Development builds only: a recording placed at Documents/autopilot-test.wav (16 kHz mono PCM16)
// is played in real time in place of the microphone, so emulators and simulators can be tested;
// the rows shown are logged to Documents/autopilot-log.txt (seconds, row id, model ms).
const TEST_WAV = `${RNFS.DocumentDirectoryPath}/autopilot-test.wav`;
const TEST_LOG = `${RNFS.DocumentDirectoryPath}/autopilot-log.txt`;
const playTestWav = (onData) => {
  let timer = null;
  RNFS.readFile(TEST_WAV, "base64").then((all) => {
    const bin = global.atob(all);
    let pos = 44; // after the WAV header
    timer = setInterval(() => {
      if (pos >= bin.length) clearInterval(timer);
      else onData(global.btoa(bin.slice(pos, pos + 4096)));
      pos += 4096;
    }, 128);
  });
  return () => clearInterval(timer);
};

const startMic = (onData) => {
  const LiveAudioStream = require("react-native-live-audio-stream").default; // eslint-disable-line global-require
  LiveAudioStream.init({
    sampleRate: SR,
    channels: 1,
    bitsPerSample: 16,
    audioSource: 6, // Android VOICE_RECOGNITION
    bufferSize: 4096,
    wavFile: "",
  });
  const sub = LiveAudioStream.on("data", onData);
  LiveAudioStream.start();
  return () => {
    LiveAudioStream.stop();
    sub.remove();
  };
};

// on: Autopilot switched on for Bani `baniId`. onRow(id): show the reader item with this id (the
// row, or in paragraph mode the paragraph that holds it).
// Returns { status: 'off' | 'loading' | 'listening' | 'following' | 'mic' | 'error', progress }.
const useAutopilot = (on, baniId, length, isParagraphMode, onRow) => {
  const [status, setStatus] = useState("off");
  const [progress, setProgress] = useState(0);
  const isScreenAwake = useSelector((state) => state.isScreenAwake);
  const awakeRef = useRef(isScreenAwake);
  awakeRef.current = isScreenAwake;
  const onRowRef = useRef(onRow);
  onRowRef.current = onRow;

  useEffect(() => {
    if (!on) {
      setStatus("off");
      return undefined;
    }
    const bani = Number(baniId);
    let live = true;
    let queue = [];
    let queued = 0;
    let busy = null; // the running drain, if any
    let follower = null;
    let shown = null;
    let heardS = 0; // seconds of audio given to the follower
    let silentS = 0;
    let micOff = false; // "Microphone is off" is showing
    let lastData = 0; // when audio last arrived (a phone call on iOS stops it altogether)
    let watchdog = null;
    let stopSource = null;
    const shownAs = {}; // row id -> reader item id

    const drainQueue = async () => {
      while (live && queue.length) {
        const pcm = queue.shift();
        queued -= pcm.length;
        heardS += pcm.length / SR;
        try {
          // eslint-disable-next-line no-await-in-loop
          const r = await follower.push(pcm);
          if (live && r && r.verseIndex >= 0 && r.verseId !== shown) {
            shown = r.verseId;
            setStatus("following");
            onRowRef.current(shownAs[r.verseId] || r.verseId);
            if (__DEV__) {
              const row = `${heardS.toFixed(2)} ${r.verseId} ${follower.infer.lastMs}\n`;
              RNFS.appendFile(TEST_LOG, row).catch(() => {});
            }
          }
        } catch (e) {
          logError(e);
        }
      }
    };
    const drain = () => {
      if (busy || !follower) return;
      busy = drainQueue().finally(() => {
        busy = null;
      });
    };
    // No sound, or no audio at all, for a few seconds: the microphone is off or taken (a phone call).
    const showMic = (off) => {
      if (off === micOff) return;
      micOff = off;
      setStatus(off ? "mic" : (shown && "following") || "listening");
    };
    const onData = (b64) => {
      if (!live) return;
      lastData = Date.now();
      const { pcm, sound } = toFloat(b64);
      silentS = sound ? 0 : silentS + pcm.length / SR;
      if (silentS >= SILENT_S) showMic(true);
      else if (sound) showMic(false);
      queue.push(pcm);
      queued += pcm.length;
      while (queued > MAX_BACKLOG && queue.length > 1) queued -= queue.shift().length;
      drain();
    };

    (async () => {
      try {
        setStatus("loading");
        if (!(await micGranted())) {
          if (live) setStatus("mic");
          return;
        }
        activateKeepAwake(); // the screen stays on (a locked phone would stop the download)
        await ensureModel((p) => live && setProgress(p));
        if (!live) return;
        // The engine loads on first use only: none of it runs for anyone who never taps Autopilot.
        /* eslint-disable global-require */
        const { Infer } = require("./engine/infer");
        const { FollowerV2 } = require("./engine/follower");
        /* eslint-enable global-require */
        if (!inferPromise) inferPromise = Infer.create(MODEL_PATH);
        const infer = await inferPromise.catch(async (e) => {
          inferPromise = null;
          // A file that will not load is fetched again only if it is no longer the model (a load can
          // also fail for want of memory, and the model must not then be downloaded on every tap).
          if (!(await modelReady())) await RNFS.unlink(MODEL_PATH).catch(() => {});
          throw e;
        });
        const { lines, background } = await autopilotText(bani, length);
        if (!live) return;
        let para = null;
        let paraId = null;
        lines.forEach((l) => {
          if (l.paragraph !== para) [para, paraId] = [l.paragraph, l.verseId];
          shownAs[l.verseId] = isParagraphMode ? paraId : l.verseId;
        });
        follower = new FollowerV2(infer, lines, {
          baniId: bani,
          background,
          inputSr: SR,
          ...PAATH,
        });
        stopSource =
          __DEV__ && (await RNFS.exists(TEST_WAV)) ? playTestWav(onData) : startMic(onData);
        if (!live) {
          stopSource();
          return;
        }
        lastData = Date.now();
        watchdog = setInterval(() => {
          if (Date.now() - lastData > SILENT_S * 1000) showMic(true);
        }, 1000);
        setStatus("listening");
      } catch (e) {
        logError(e);
        if (live) setStatus("error");
      }
    })();

    return () => {
      live = false;
      queue = [];
      if (stopSource) stopSource();
      clearInterval(watchdog);
      if (download && !inferPromise) {
        download.cancel(); // switched off mid-download: the next tap starts afresh
        download = null;
      }
      // Give the model's memory back to the phone once a pass still running has finished (it loads
      // again in about a second).
      const loaded = inferPromise;
      inferPromise = null;
      if (loaded) {
        Promise.all([loaded, busy])
          .then(([i]) => i.release())
          .catch(() => {});
      }
      if (!awakeRef.current) deactivateKeepAwake(); // back to the user's setting
    };
  }, [on, baniId, length, isParagraphMode]);

  return { status, progress };
};

export default useAutopilot;
