// Records one line at a time for the hosted scorer. Successful line results survive
// retries; the final line assembles a pauri review. The child ends each line explicitly;
// this is not automatic speech following.
import { useCallback, useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import RNFS from "react-native-fs";
import { resetPlayer } from "@common/TrackPlayerUtils";
import { toReviewedLines } from "../design/align";
import { tokenizeLine } from "../design/wordFeedback";
import { fetchManifest, referenceUrl, scoreRecording, seqsForPauri } from "../scoring/client";
import { BANI, DEFAULT_RECITER } from "../scoring/config";

export const OPT_IN_MESSAGE =
  'Turn on "Check pronunciation online" in Settings to check your recitation.';

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

// Re-index words to the screen, then attach clips and star bands from the manifest.
const toReview = (pauri, response, manifest, reciter, seqs) => {
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
  if (!manifest) return review;
  return review.map((line, lineIndex) => {
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

export const useRecordedRecitation = (pauris, { optedIn = false, reciter: wanted } = {}) => {
  const recorderRef = useRef(null);
  const [granted, setGranted] = useState(Platform.OS !== "android");
  const [error, setError] = useState(optedIn ? null : OPT_IN_MESSAGE);
  const [checking, setChecking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [manifest, setManifest] = useState(null);
  const [lineScores, setLineScores] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const pauriRef = useRef(null);
  const lineRef = useRef(0);
  const lineCountRef = useRef(0);
  const perLineRef = useRef(new Map());

  const getRecorder = () => {
    if (!recorderRef.current) recorderRef.current = new AudioRecorderPlayer();
    return recorderRef.current;
  };

  useEffect(() => {
    setError(optedIn ? null : OPT_IN_MESSAGE);
    // Scoring still works without the manifest; only clips, bands and coverage are lost.
    if (optedIn) {
      fetchManifest()
        .then(setManifest)
        .catch(() => {});
    }
  }, [optedIn]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
      .then(setGranted)
      .catch(() => setGranted(false));
  }, []);

  const preferred = wanted || DEFAULT_RECITER;
  const reciter =
    !manifest || !manifest.reciters || manifest.reciters.includes(preferred)
      ? preferred
      : manifest.reciters[0] || preferred;

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

  const beginRecording = useCallback(async () => {
    if (!optedIn) {
      setError(OPT_IN_MESSAGE);
      return false;
    }
    try {
      if (!(await askMicrophone())) {
        setGranted(false);
        setError("Kids Mode needs the microphone to hear your recitation.");
        return false;
      }
      setGranted(true);
      // Playback and recording share one iOS audio session, so release the reference first.
      await resetPlayer();
      const recorder = getRecorder();
      recorder.addRecordBackListener((e) => {
        // Metering is dBFS, roughly -60 (quiet room) to 0.
        const db = typeof e.currentMetering === "number" ? e.currentMetering : -160;
        setLevel(Math.max(0, Math.min(1, (db + 60) / 60)));
      });
      await recorder.startRecorder(recorderPath(), undefined, true);
      setIsRecording(true);
      return true;
    } catch (caught) {
      setError(caught?.message || "We could not turn on the microphone.");
      return false;
    }
  }, [optedIn]);

  const cancel = useCallback(async () => {
    await stopRecorder();
    await removeRecording();
  }, []);

  const start = useCallback(
    async (pauriNumber, lineCount = 0) => {
      setError(optedIn ? null : OPT_IN_MESSAGE);
      pauriRef.current = pauriNumber;
      lineCountRef.current = lineCount;
      lineRef.current = 0;
      perLineRef.current = new Map();
      setLineScores([]);
      setCurrentLine(0);
      return beginRecording();
    },
    [beginRecording, optedIn]
  );

  const stop = useCallback(async () => {
    await stopRecorder();
    const pauri = pauris.find((p) => p.number === pauriRef.current);
    if (!pauri) return { retry: "We did not hear anything. Try again." };

    const seqs = seqsForPauri(pauris, pauri.number);
    const lineIndex = lineRef.current;
    const seq = seqs[lineIndex];
    if (seq === undefined) return { retry: "We could not find that line. Try again." };

    // An empty line map means the service publishes no coverage at all, not "nothing covered".
    const covered = manifest?.lines?.[reciter];
    if (covered && Object.keys(covered).length > 0 && !covered[String(seq)]) {
      await removeRecording();
      return { retry: "This line is not ready yet. Try Pauri 1." };
    }

    setChecking(true);
    try {
      // Deleted once scored or failed, before the next line reuses the path.
      const response = await scoreRecording(LINE_PATH, {
        bani: BANI,
        reciter,
        seqs: [seq],
        optedIn,
      }).finally(removeRecording);
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

      const next = lineIndex + 1;
      if (next < lineCountRef.current) {
        lineRef.current = next;
        setCurrentLine(next);
        // Keep the microphone open so the child carries straight on.
        await beginRecording();
        return { nextLine: next, lineScore };
      }

      const gathered = perLineRef.current;
      const combined = {
        status: "ok",
        lineScores: pauri.lines.map((_, i) => gathered.get(i)?.score ?? 0),
        words: pauri.lines.flatMap((_, i) => gathered.get(i)?.words ?? []),
        provider: "service",
        focus: null,
      };
      const review = toReview(pauri, combined, manifest, reciter, seqs);
      const heard = [...gathered.values()].map((r) => r.score);
      const score = heard.length ? Math.round(heard.reduce((n, v) => n + v, 0) / heard.length) : 0;
      return { review, score };
    } catch (caught) {
      const message = caught?.message || "We could not check that. Try again.";
      setError(message);
      return { retry: message };
    } finally {
      setChecking(false);
    }
  }, [pauris, manifest, reciter, optedIn, beginRecording]);

  useEffect(
    () => () => {
      recorderRef.current?.removeRecordBackListener();
      recorderRef.current?.stopRecorder().catch(() => {});
      removeRecording();
    },
    []
  );

  return {
    granted,
    requestPermission,
    cancel,
    retry: beginRecording,
    start,
    stop,
    isRecording,
    level,
    currentLine,
    lineScores,
    error,
    checking,
    following: true,
    provider: "service",
  };
};

export default useRecordedRecitation;
