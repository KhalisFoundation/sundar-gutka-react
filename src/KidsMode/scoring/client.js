// One recording, one request: the service aligns a complete recitation, so the app records
// a line and posts it when the child stops.
import {
  BANI,
  FIRST_PAURI_SEQ,
  REQUEST_TIMEOUT_MS,
  SCORING_API_KEY,
  SCORING_BASE_URL,
  SCORING_CONFIGURED,
} from "./config";

export class ScoringError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ScoringError";
    this.status = status;
  }
}

// BaniDB verse sequences for a pauri's lines, assuming bani.json splits lines as BaniDB does.
export const seqsForPauri = (pauris, pauriNumber) => {
  let first = FIRST_PAURI_SEQ;
  const found = pauris.find((p) => {
    if (p.number === pauriNumber) return true;
    first += p.lines.length;
    return false;
  });
  return found ? found.lines.map((_, i) => first + i) : [];
};

// "5-10" when contiguous, "5,7" otherwise.
export const formatSeqs = (seqs) => {
  const contiguous = seqs.every((n, i) => i === 0 || n === seqs[i - 1] + 1);
  return contiguous && seqs.length > 1 ? `${seqs[0]}-${seqs[seqs.length - 1]}` : seqs.join(",");
};

const MIME = { m4a: "audio/mp4", mp4: "audio/mp4", aac: "audio/aac", wav: "audio/wav" };

const appendAudio = (form, fileUri) => {
  const ext = (fileUri.split("?")[0].split(".").pop() || "m4a").toLowerCase();
  const uri = fileUri.startsWith("file://") ? fileUri : `file://${fileUri}`;
  form.append("audio", { uri, name: `recording.${ext}`, type: MIME[ext] || "audio/mp4" });
};

const request = async (path, init, attempt = 0) => {
  // Fail with the real reason rather than a network error nobody can action.
  if (!SCORING_CONFIGURED) {
    throw new ScoringError("The checking service is not configured yet (KIDS_SCORING_URL).");
  }
  const headers = { Accept: "application/json" };
  if (SCORING_API_KEY) headers["X-Api-Key"] = SCORING_API_KEY;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${SCORING_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (caught) {
    // A cold replica can be slow, so one failed attempt is retried.
    if (attempt < 1) return request(path, init, attempt + 1);
    throw new ScoringError(
      controller.signal.aborted
        ? "The checking service took too long. Please try again."
        : "Could not reach the checking service. Check the connection and try again."
    );
  } finally {
    clearTimeout(timer);
  }
};

// Accepts 0-1 as the contract states, or an already-scaled percent.
const percent = (value) => {
  if (value === undefined || value === null || !Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, Math.min(100, value <= 1 ? value * 100 : value)));
};

// Map the wire response onto the app's result shape; line indexes follow `seqs`.
export const toScoreResponse = (body, seqs) => {
  const lineOf = new Map(seqs.map((seq, i) => [seq, i]));
  if (body.status === "unclear") {
    return { status: "unclear", lineScores: [], words: [], provider: "service", focus: null };
  }
  const lineScores = seqs.map(() => 0);
  const words = [];
  (body.lines || []).forEach((line) => {
    const lineIndex = lineOf.get(Number(line.seq));
    if (lineIndex === undefined) return;
    lineScores[lineIndex] = percent(line.share_like ?? line.share_like_reciter);
    (line.words || []).forEach((w) => {
      words.push({ lineIndex, wordIndex: w.idx, state: w.state, reasons: w.reasons || [] });
    });
  });
  const focusLine = body.focus ? lineOf.get(Number(body.focus.seq)) : undefined;
  return {
    status: "ok",
    lineScores,
    words,
    provider: "service",
    focus:
      body.focus && focusLine !== undefined
        ? { lineIndex: focusLine, wordIndex: body.focus.idx }
        : null,
  };
};

// Absolute URL for a manifest path such as `ggs/5/words/0.wav`.
export const referenceUrl = (path) => `${SCORING_BASE_URL}/reference/${path}`;

let manifestCache = null;

// The reciters, word clips and star bands; fetched once per app session.
export const fetchManifest = () => {
  if (!manifestCache) {
    manifestCache = request(`/v1/manifest?bani=${BANI}`, { method: "GET" })
      .then(async (response) => {
        if (!response.ok) {
          throw new ScoringError(`Manifest unavailable (${response.status})`, response.status);
        }
        return response.json();
      })
      .catch((caught) => {
        // A failed fetch is retried next time rather than cached.
        manifestCache = null;
        throw caught;
      });
  }
  return manifestCache;
};

export const resetManifestCache = () => {
  manifestCache = null;
};

// Nothing leaves the device unless the parent turned on "Check pronunciation online".
export const scoreRecording = async (fileUri, { bani = BANI, reciter, seqs, optedIn = false }) => {
  if (!optedIn) return { status: "opted_out" };
  const form = new FormData();
  form.append("bani", String(bani));
  form.append("reciter", reciter);
  form.append("seqs", formatSeqs(seqs));
  appendAudio(form, fileUri);

  const response = await request("/v1/score", { method: "POST", body: form });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ScoringError(
      response.status === 401 || response.status === 403
        ? "The checking service did not accept this app’s key."
        : `The checking service could not score this (${response.status}).${
            detail ? ` ${detail.slice(0, 120)}` : ""
          }`,
      response.status
    );
  }
  return toScoreResponse(await response.json(), seqs);
};
