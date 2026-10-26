// One recording, one request: the service aligns a complete recitation, so the app records
// a line and posts it when the child stops.
import { logError } from "@common/firebase/crashlytics";
import {
  REQUEST_TIMEOUT_MS,
  SCORING_API_KEY,
  SCORING_BASE_URL,
  SCORING_CONFIGURED,
} from "./config";
import {
  CHECK_FAILED_MESSAGE,
  NOT_CONFIGURED_MESSAGE,
  OFFLINE_MESSAGE,
  TIMEOUT_MESSAGE,
  UNAVAILABLE_MESSAGE,
} from "./messages";

export class ScoringError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ScoringError";
    this.status = status;
  }
}

// BaniDB verse sequences for a pauri's lines, carried on each line from the app's database.
export const seqsForPauri = (pauris, pauriNumber) =>
  pauris.find((p) => p.number === pauriNumber)?.lines.map((line) => line.seq) ?? [];

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
    throw new ScoringError(NOT_CONFIGURED_MESSAGE);
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
    // A dropped connection is retried once; a timeout is not, as the job may still be running.
    if (attempt < 1 && !controller.signal.aborted) return request(path, init, attempt + 1);
    logError(`Kids scoring request ${path} failed`, caught);
    throw new ScoringError(controller.signal.aborted ? TIMEOUT_MESSAGE : OFFLINE_MESSAGE);
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

const manifests = new Map();

// A bani's reciters, word clips and star bands; fetched once per bani per app session.
export const fetchManifest = (bani) => {
  if (!manifests.has(bani)) {
    manifests.set(
      bani,
      request(`/v1/manifest?bani=${bani}`, { method: "GET" })
        .then(async (response) => {
          if (!response.ok) {
            logError("Kids scoring manifest failed", new Error(`HTTP ${response.status}`));
            throw new ScoringError(UNAVAILABLE_MESSAGE, response.status);
          }
          return response.json();
        })
        .catch((caught) => {
          // A failed fetch is retried next time rather than cached.
          manifests.delete(bani);
          throw caught;
        })
    );
  }
  return manifests.get(bani);
};

// Nothing leaves the device unless the parent turned on "Check pronunciation online".
export const scoreRecording = async (fileUri, { bani, reciter, seqs, optedIn = false }) => {
  if (!optedIn) return { status: "opted_out" };
  const form = new FormData();
  form.append("bani", String(bani));
  form.append("reciter", reciter);
  form.append("seqs", formatSeqs(seqs));
  appendAudio(form, fileUri);

  const response = await request("/v1/score", { method: "POST", body: form });
  if (!response.ok) {
    // The status and the service's reply are for whoever reads the logs, not the child.
    const detail = await response.text().catch(() => "");
    logError("Kids scoring failed", new Error(`HTTP ${response.status} ${detail.slice(0, 300)}`));
    const keyRejected = response.status === 401 || response.status === 403;
    throw new ScoringError(
      keyRejected ? UNAVAILABLE_MESSAGE : CHECK_FAILED_MESSAGE,
      response.status
    );
  }
  return toScoreResponse(await response.json(), seqs);
};
