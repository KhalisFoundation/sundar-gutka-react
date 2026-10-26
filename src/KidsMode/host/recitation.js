// Records one line at a time for the hosted scorer. Successful line results survive
// retries; the final line assembles a pauri review. The child ends each line explicitly;
// this is not automatic speech following.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, PermissionsAndroid, Platform } from "react-native";
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncodingOption,
  OutputFormatAndroidType,
} from "react-native-audio-recorder-player";
import RNFS from "react-native-fs";
import { logError } from "@common/firebase/crashlytics";
import { resetPlayer } from "@common/TrackPlayerUtils";
import { toReviewedLines } from "../design/align";
import { tokenizeLine } from "../design/wordFeedback";
import { DEFAULT_RECITER } from "../reciters";
import {
  fetchManifest,
  referenceUrl,
  scoreRecording,
  ScoringError,
  seqsForPauri,
} from "../scoring/client";
import { SCORING_CONFIGURED } from "../scoring/config";
import {
  BACKGROUND_MESSAGE,
  CHECK_FAILED_MESSAGE,
  MICROPHONE_MESSAGE,
  NO_LINES_MESSAGE,
  NOT_CAUGHT_MESSAGE,
  NOT_CONFIGURED_MESSAGE,
  OPT_IN_MESSAGE,
  RECITER_MESSAGE,
} from "../scoring/messages";

// AAC mono on both platforms; iOS would otherwise record Apple Lossless, which the service cannot decode.
const RECORDING = {
  AVFormatIDKeyIOS: AVEncodingOption.aac,
  AVNumberOfChannelsKeyIOS: 1,
  AVSampleRateKeyIOS: 44100,
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
};

const LINE_PATH = `${RNFS.CachesDirectoryPath}/kids-line.m4a`;

// iOS treats a path without file:// as relative to Caches; Android wants a plain path.
const recorderPath = () => (Platform.OS === "ios" ? `file://${LINE_PATH}` : LINE_PATH);

// iOS asks on first record from NSMicrophoneUsageDescription; Android needs a runtime request.
const askMicrophone = async () =>
  Platform.OS !== "android" ||
  (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)) ===
    PermissionsAndroid.RESULTS.GRANTED;

// Service word idx -> on-screen word index, matched by Gurmukhi in order, so a difference
// in how the two sides split a line cannot shift every highlight.
const wordIndexMap = (text, line) => {
  const onScreen = tokenizeLine(text)
    .filter((p) => p.word)
    .map((p) => p.text);
  const map = new Map();
  if (!line) return map;
  let from = 0;
  line.words.forEach((word) => {
    const at = onScreen.indexOf(word.gurmukhi, from);
    if (at >= 0) {
      map.set(word.idx, at);
      from = at + 1;
    }
  });
  return map;
};

const starsFor = (pct, bands) => bands.filter((band) => pct >= band).length;

// A line the service never checked has no score: not 0%, and no word judged.
const unchecked = (line) => ({
  ...line,
  score: null,
  tokens: line.tokens.map((token) =>
    token.kind === "word"
      ? { ...token, feedback: { ...token.feedback, score: null, state: "unclear", reasons: [] } }
      : token
  ),
});

// Re-index words to the screen, then attach clips and star bands from the manifest.
const toReview = (pauri, response, manifest, reciter, seqs, checked) => {
  const lines = seqs.map((seq) => manifest?.lines?.[reciter]?.[String(seq)]);
  const maps = pauri.lines.map((line, i) => wordIndexMap(line.text, lines[i]));
  const remap = (lineIndex, idx) => maps[lineIndex]?.get(idx) ?? idx;
  const review = toReviewedLines(pauri.lines, {
    ...response,
    words: response.words.map((w) => ({ ...w, wordIndex: remap(w.lineIndex, w.wordIndex) })),
    focus: response.focus
      ? {
          ...response.focus,
          wordIndex: remap(response.focus.lineIndex, response.focus.wordIndex),
        }
      : null,
  });
  return review.map((line, lineIndex) => {
    if (!checked.has(lineIndex)) return unchecked(line);
    if (!manifest) return line;
    const clips = new Map();
    (lines[lineIndex]?.words || []).forEach((word) => {
      clips.set(remap(lineIndex, word.idx), referenceUrl(word.clip_url));
    });
    return {
      ...line,
      stars: starsFor(line.score, manifest.star_bands || []),
      tokens: line.tokens.map((token) =>
        token.kind === "word" && clips.has(token.feedback.wordIndex)
          ? { ...token, feedback: { ...token.feedback, clip: clips.get(token.feedback.wordIndex) } }
          : token
      ),
    };
  });
};

const removeRecording = () => RNFS.unlink(LINE_PATH).catch(() => {});

// Cancelled work cleans up after itself and reports nothing.
const abandon = () => removeRecording().then(() => null);

// A recorder that never started, or was cut off, leaves no file or an empty one.
const recordedBytes = async () => {
  try {
    return (await RNFS.exists(LINE_PATH)) ? Number((await RNFS.stat(LINE_PATH)).size) : 0;
  } catch {
    return 0;
  }
};

// First line at or after `from` the service can check, or -1 when none is left.
const nextCheckable = (seqs, from, manifest, reciter) => {
  const covered = manifest?.lines?.[reciter];
  // An empty line map means the service publishes no coverage at all, not "nothing covered".
  const all = !covered || Object.keys(covered).length === 0;
  for (let i = from; i < seqs.length; i += 1) {
    if (seqs[i] !== undefined && (all || covered[String(seqs[i])])) return i;
  }
  return -1;
};

export const useRecordedRecitation = (pauris, { optedIn = false, reciter: wanted, bani } = {}) => {
  const recorderRef = useRef(null);
  const [granted, setGranted] = useState(Platform.OS !== "android");
  let blocked = null;
  if (!SCORING_CONFIGURED) blocked = NOT_CONFIGURED_MESSAGE;
  else if (!optedIn) blocked = OPT_IN_MESSAGE;
  const [error, setError] = useState(blocked);
  const [checking, setChecking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [manifest, setManifest] = useState(null);
  const [lineScores, setLineScores] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const pauriRef = useRef(null);
  const lineRef = useRef(0);
  const perLineRef = useRef(new Map());
  // Bumped by cancel, unmount and backgrounding; work begun under an older value stops at
  // its next await instead of reopening the microphone.
  const runRef = useRef(0);
  const stopRef = useRef(null);
  const interruptedRef = useRef(false);

  const getRecorder = () => {
    if (!recorderRef.current) recorderRef.current = new AudioRecorderPlayer();
    return recorderRef.current;
  };

  useEffect(() => {
    setError(blocked);
    setManifest(null);
    // Scoring still works without the manifest; only clips, bands and coverage are lost.
    if (!optedIn || !bani) return undefined;
    let live = true;
    fetchManifest(bani)
      .then((value) => live && setManifest(value))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [optedIn, blocked, bani]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
      .then(setGranted)
      .catch(() => setGranted(false));
  }, []);

  // Only the reciter the screen names: scoring against another voice would grade the child
  // on a recitation they did not hear.
  const reciter = wanted || DEFAULT_RECITER;
  const unlisted = manifest?.reciters && !manifest.reciters.includes(reciter);
  const unavailable = blocked ?? (unlisted ? RECITER_MESSAGE : null);

  const requestPermission = useCallback(async () => {
    try {
      const allowed = await askMicrophone();
      setGranted(allowed);
      return allowed;
    } catch {
      return false;
    }
  }, []);

  const stopRecorder = async () => {
    const recorder = getRecorder();
    recorder.removeRecordBackListener();
    await recorder.stopRecorder().catch(() => {});
    setIsRecording(false);
    setLevel(0);
  };

  const beginRecording = useCallback(
    async (run = runRef.current) => {
      const gone = () => run !== runRef.current;
      if (unavailable) {
        setError(unavailable);
        return false;
      }
      try {
        const allowed = await askMicrophone();
        if (gone()) return abandon();
        if (!allowed) {
          setGranted(false);
          setError("Kids Mode needs the microphone to hear your recitation.");
          return false;
        }
        setGranted(true);
        // Playback and recording share one iOS audio session, so release the reference first.
        await resetPlayer();
        if (gone()) return abandon();
        // A score that lands while the app is away must not reopen the microphone there.
        if (AppState.currentState === "background") {
          interruptedRef.current = true;
          setError(BACKGROUND_MESSAGE);
          return false;
        }
        const recorder = getRecorder();
        recorder.addRecordBackListener((e) => {
          // Metering is dBFS, roughly -60 (quiet room) to 0.
          const db = typeof e.currentMetering === "number" ? e.currentMetering : -160;
          setLevel(Math.max(0, Math.min(1, (db + 60) / 60)));
        });
        await recorder.startRecorder(recorderPath(), RECORDING, true);
        // Cancelled while the recorder was starting, so it is running now with nobody to stop it.
        if (gone()) {
          await stopRecorder();
          return abandon();
        }
        setIsRecording(true);
        return true;
      } catch (caught) {
        if (gone()) return abandon();
        logError("Kids Mode could not start the recorder", caught);
        setError(MICROPHONE_MESSAGE);
        return false;
      }
    },
    [unavailable]
  );

  const cancel = useCallback(async () => {
    runRef.current += 1;
    await stopRecorder();
    await removeRecording();
  }, []);

  // A call, Siri or leaving the app can cut the recorder off while the screen still says
  // recording; drop the line rather than post a truncated file.
  useEffect(() => {
    if (!isRecording) return undefined;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "background" && state !== "inactive") return;
      interruptedRef.current = true;
      setError(BACKGROUND_MESSAGE);
      cancel();
    });
    return () => subscription.remove();
  }, [isRecording, cancel]);

  const start = useCallback(
    async (pauriNumber) => {
      if (stopRef.current) return false;
      interruptedRef.current = false;
      setError(unavailable);
      if (unavailable) return false;
      pauriRef.current = pauriNumber;
      perLineRef.current = new Map();
      setLineScores([]);
      // Lines the service has no reference for are skipped, so they cannot hold up the pauri.
      const first = nextCheckable(seqsForPauri(pauris, pauriNumber), 0, manifest, reciter);
      if (first < 0) {
        setError(NO_LINES_MESSAGE);
        return false;
      }
      lineRef.current = first;
      setCurrentLine(first);
      return beginRecording();
    },
    [beginRecording, unavailable, pauris, manifest, reciter]
  );

  const retry = useCallback(async () => {
    if (stopRef.current) return false;
    // Fails once after an interruption, which sends the challenge back to "ready" with the reason.
    if (interruptedRef.current) {
      interruptedRef.current = false;
      setError(BACKGROUND_MESSAGE);
      return false;
    }
    return beginRecording();
  }, [beginRecording]);

  const finishLine = useCallback(async () => {
    const run = runRef.current;
    const gone = () => run !== runRef.current;
    await stopRecorder();
    if (gone()) return abandon();
    if (interruptedRef.current) return { retry: BACKGROUND_MESSAGE };
    const pauri = pauris.find((p) => p.number === pauriRef.current);
    if (!pauri) return { retry: "We did not hear anything. Try again." };

    const seqs = seqsForPauri(pauris, pauri.number);
    const lineIndex = lineRef.current;
    const seq = seqs[lineIndex];
    if (seq === undefined) return { retry: "We could not find that line. Try again." };

    const bytes = await recordedBytes();
    if (gone()) return abandon();
    if (bytes <= 0) {
      await removeRecording();
      return { retry: NOT_CAUGHT_MESSAGE };
    }

    setChecking(true);
    try {
      // Deleted once scored or failed, before the next line reuses the path.
      const response = await scoreRecording(LINE_PATH, {
        bani,
        reciter,
        seqs: [seq],
        optedIn,
      }).finally(removeRecording);
      if (gone()) return null;
      if (response.status === "opted_out") {
        setError(OPT_IN_MESSAGE);
        return { retry: OPT_IN_MESSAGE };
      }
      if (response.status === "unclear") {
        return { retry: "We could not hear you. Find a quiet spot and say it again." };
      }

      const lineScore = response.lineScores[0] ?? 0;
      // The service numbers words within the range it was given, so re-key onto this line.
      perLineRef.current.set(lineIndex, {
        score: lineScore,
        words: response.words.map((w) => ({ ...w, lineIndex })),
      });
      setLineScores(
        [...perLineRef.current.entries()]
          .map(([i, r]) => ({ lineIndex: i, score: r.score }))
          .sort((a, b) => a.lineIndex - b.lineIndex)
      );

      const next = nextCheckable(seqs, lineIndex + 1, manifest, reciter);
      if (next >= 0) {
        lineRef.current = next;
        setCurrentLine(next);
        // Keep the microphone open so the child carries straight on.
        if ((await beginRecording(run)) === null) return null;
        return { nextLine: next, lineScore };
      }

      // currentLine stays put: the design treats currentLine past the last line as "finish".
      const gathered = perLineRef.current;
      const combined = {
        status: "ok",
        lineScores: pauri.lines.map((_, i) => gathered.get(i)?.score ?? null),
        words: pauri.lines.flatMap((_, i) => gathered.get(i)?.words ?? []),
        provider: "service",
        focus: null,
      };
      const review = toReview(pauri, combined, manifest, reciter, seqs, gathered);
      // Skipped lines were never heard, so they stay out of the average.
      const heard = [...gathered.values()].map((r) => r.score);
      const score = heard.length ? Math.round(heard.reduce((n, v) => n + v, 0) / heard.length) : 0;
      return { review, score };
    } catch (caught) {
      if (gone()) return null;
      // The client's own errors are already child-safe and logged; anything else is neither.
      const known = caught instanceof ScoringError;
      if (!known) logError("Kids Mode could not check a line", caught);
      const message = known ? caught.message : CHECK_FAILED_MESSAGE;
      setError(message);
      return { retry: message };
    } finally {
      setChecking(false);
    }
  }, [pauris, manifest, reciter, optedIn, bani, beginRecording]);

  // A second tap or effect run joins the check in flight instead of racing it over LINE_PATH.
  const stop = useCallback(() => {
    if (!stopRef.current) {
      stopRef.current = finishLine().finally(() => {
        stopRef.current = null;
      });
    }
    return stopRef.current;
  }, [finishLine]);

  useEffect(
    () => () => {
      runRef.current += 1;
      recorderRef.current?.removeRecordBackListener();
      recorderRef.current?.stopRecorder().catch(() => {});
      removeRecording();
    },
    []
  );

  // The host's memo and the design's effects key on this object, so it changes only when a
  // field does (level still ticks while recording).
  return useMemo(
    () => ({
      granted,
      requestPermission,
      cancel,
      retry,
      start,
      stop,
      isRecording,
      level,
      currentLine,
      lineScores,
      error,
      checking,
      provider: "service",
    }),
    [
      granted,
      requestPermission,
      cancel,
      retry,
      start,
      stop,
      isRecording,
      level,
      currentLine,
      lineScores,
      error,
      checking,
    ]
  );
};

export default useRecordedRecitation;
