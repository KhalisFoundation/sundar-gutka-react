import { AppState } from "react-native";
import RNFS from "react-native-fs";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { logError } from "@common/firebase/crashlytics";
import { fetchManifest, scoreRecording } from "../scoring/client";
import { useRecordedRecitation } from "./recitation";

const mockRecorder = {
  addRecordBackListener: jest.fn(),
  removeRecordBackListener: jest.fn(),
  startRecorder: jest.fn(),
  stopRecorder: jest.fn(),
};

jest.mock("react-native-audio-recorder-player", () => ({
  __esModule: true,
  default: jest.fn(() => mockRecorder),
  AudioEncoderAndroidType: { AAC: 3 },
  AudioSourceAndroidType: { MIC: 1 },
  AVEncodingOption: { aac: "aac" },
  OutputFormatAndroidType: { MPEG_4: 2 },
}));
jest.mock("@common/firebase/crashlytics", () => ({ logError: jest.fn() }));
jest.mock("@common/constant", () => ({ KIDS_SCORING_URL: "https://score.example" }));
jest.mock("@common/TrackPlayerUtils", () => ({ resetPlayer: jest.fn(() => Promise.resolve()) }));
jest.mock("../scoring/client", () => ({
  ...jest.requireActual("../scoring/client"),
  fetchManifest: jest.fn(),
  scoreRecording: jest.fn(),
}));

const pauris = [
  {
    number: 1,
    lines: [
      { seq: 5, text: "ਸੋਚੈ ਸੋਚਿ ਨ ਹੋਵਈ" },
      { seq: 6, text: "ਚੁਪੈ ਚੁਪ ਨ ਹੋਵਈ" },
      { seq: 7, text: "ਭੁਖਿਆ ਭੁਖ ਨ ਉਤਰੀ" },
    ],
  },
];
// Seq 6 has no reference for this reciter.
const manifest = {
  reciters: ["bjs"],
  lines: { bjs: { 5: { words: [] }, 7: { words: [] } } },
  star_bands: [50, 70, 90],
};
const scored = (pct) => ({
  status: "ok",
  lineScores: [pct],
  words: [],
  provider: "service",
  focus: null,
});
const options = { optedIn: true, reciter: "bjs", bani: 2 };

const mount = async (opts = options) => {
  const hook = renderHook(() => useRecordedRecitation(pauris, opts));
  // Let the manifest land.
  await act(async () => {});
  return hook;
};

const stopLine = async (result) => {
  let out;
  await act(async () => {
    out = await result.current.stop();
  });
  return out;
};

describe("useRecordedRecitation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecorder.startRecorder.mockResolvedValue("file:///caches/kids-line.m4a");
    mockRecorder.stopRecorder.mockResolvedValue("stopped");
    RNFS.exists.mockResolvedValue(true);
    RNFS.stat.mockResolvedValue({ isFile: () => true, size: 2048 });
    fetchManifest.mockResolvedValue(manifest);
    scoreRecording.mockResolvedValue(scored(80));
  });

  it("keeps the opt-in gate: nothing records or uploads until the parent turns it on", async () => {
    const { result } = await mount({ ...options, optedIn: false });
    let started;
    await act(async () => {
      started = await result.current.start(1, 3);
    });
    expect(started).toBe(false);
    expect(result.current.error).toMatch(/Check pronunciation online/);
    expect(fetchManifest).not.toHaveBeenCalled();
    expect(mockRecorder.startRecorder).not.toHaveBeenCalled();
  });

  it("does not reopen the microphone when the screen closes during a check", async () => {
    const { result, unmount } = await mount();
    await act(() => result.current.start(1, 3));
    let release;
    scoreRecording.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    );
    let stopped;
    act(() => {
      stopped = result.current.stop();
    });
    await waitFor(() => expect(scoreRecording).toHaveBeenCalled());

    unmount();
    expect(mockRecorder.stopRecorder).toHaveBeenCalled();
    expect(RNFS.unlink).toHaveBeenCalled();
    await act(async () => {
      release(scored(90));
    });
    await expect(stopped).resolves.toBeNull();
    expect(mockRecorder.startRecorder).toHaveBeenCalledTimes(1);
    expect(mockRecorder.addRecordBackListener).toHaveBeenCalledTimes(1);
  });

  it("does not reopen the microphone when a check is cancelled", async () => {
    const { result } = await mount();
    await act(() => result.current.start(1, 3));
    let release;
    scoreRecording.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    );
    let stopped;
    act(() => {
      stopped = result.current.stop();
    });
    await waitFor(() => expect(scoreRecording).toHaveBeenCalled());

    await act(() => result.current.cancel());
    await act(async () => {
      release(scored(90));
    });
    await expect(stopped).resolves.toBeNull();
    expect(mockRecorder.startRecorder).toHaveBeenCalledTimes(1);
  });

  it("checks a line once when stop is called twice, and refuses a start meanwhile", async () => {
    const { result } = await mount();
    await act(() => result.current.start(1, 3));
    let first;
    let second;
    let restarted;
    await act(async () => {
      first = result.current.stop();
      second = result.current.stop();
      restarted = await result.current.start(1, 3);
      await first;
    });
    expect(second).toBe(first);
    expect(restarted).toBe(false);
    expect(scoreRecording).toHaveBeenCalledTimes(1);
  });

  it("keeps its identity across renders when nothing changed", async () => {
    const { result, rerender } = await mount();
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });

  it("skips a line the service cannot check and leaves it out of the score", async () => {
    const { result } = await mount();
    await act(() => result.current.start(1, 3));
    expect(result.current.currentLine).toBe(0);

    expect(await stopLine(result)).toEqual({ nextLine: 2, lineScore: 80 });
    expect(result.current.currentLine).toBe(2);
    // The recording is deleted once scored.
    expect(RNFS.unlink).toHaveBeenCalled();

    scoreRecording.mockResolvedValue(scored(60));
    const { review, score } = await stopLine(result);
    expect(score).toBe(70);
    expect(scoreRecording.mock.calls.map(([, sent]) => sent.seqs)).toEqual([[5], [7]]);
    expect(result.current.lineScores.map((r) => r.lineIndex)).toEqual([0, 2]);
    expect(review[1].score).toBeNull();
    expect(review[1].stars).toBeUndefined();
    const words = review[1].tokens.filter((token) => token.kind === "word");
    expect(words.every((token) => token.feedback.state === "unclear")).toBe(true);
    expect(review[0].score).toBe(80);
  });

  it("reviews a fully covered pauri exactly as before", async () => {
    fetchManifest.mockResolvedValue({
      reciters: ["bjs"],
      lines: {
        bjs: {
          5: { words: [{ idx: 0, gurmukhi: "ਸੋਚੈ", clip_url: "bjs/5/words/0.wav" }] },
          6: { words: [{ idx: 1, gurmukhi: "ਚੁਪ", clip_url: "bjs/6/words/1.wav" }] },
          7: { words: [] },
        },
      },
      star_bands: [50, 70, 90],
    });
    const { result } = await mount();
    await act(() => result.current.start(1, 3));
    const scoreAs = (pct, state) => {
      scoreRecording.mockResolvedValue({
        ...scored(pct),
        words: [{ lineIndex: 0, wordIndex: 1, state, reasons: [] }],
      });
      return stopLine(result);
    };
    const outcomes = [
      await scoreAs(80, "check"),
      await scoreAs(60, "like"),
      await scoreAs(95, "unclear"),
    ];
    expect(outcomes).toMatchSnapshot();
  });

  it("starts on the first line it can check, and says so when it can check none", async () => {
    fetchManifest.mockResolvedValue({ ...manifest, lines: { bjs: { 6: { words: [] } } } });
    const { result } = await mount();
    await act(() => result.current.start(1, 3));
    expect(result.current.currentLine).toBe(1);

    fetchManifest.mockResolvedValue({ ...manifest, lines: { bjs: { 99: { words: [] } } } });
    const other = await mount({ ...options, bani: 3 });
    let started;
    await act(async () => {
      started = await other.result.current.start(1, 3);
    });
    expect(started).toBe(false);
    expect(other.result.current.error).toBe("This pauri can't be checked yet.");
  });

  it("never scores against a reciter the screen does not name", async () => {
    fetchManifest.mockResolvedValue({ ...manifest, reciters: ["ggs"] });
    const { result } = await mount();
    let started;
    await act(async () => {
      started = await result.current.start(1, 3);
    });
    expect(started).toBe(false);
    expect(result.current.error).toBe("Checking isn't available for this reciter yet.");
    expect(mockRecorder.startRecorder).not.toHaveBeenCalled();
    expect(scoreRecording).not.toHaveBeenCalled();
  });

  it("drops the line when the app goes to the background, then sends the child back once", async () => {
    const { result } = await mount();
    await act(() => result.current.start(1, 3));
    expect(result.current.isRecording).toBe(true);
    const [, onChange] = AppState.addEventListener.mock.calls.at(-1);
    mockRecorder.stopRecorder.mockClear();

    await act(async () => onChange("background"));
    expect(mockRecorder.stopRecorder).toHaveBeenCalled();
    expect(RNFS.unlink).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBe(
      "The recording stopped when the app went to the background. Try that line again."
    );

    expect(await stopLine(result)).toEqual({ retry: result.current.error });
    expect(scoreRecording).not.toHaveBeenCalled();
    let retried;
    await act(async () => {
      retried = await result.current.retry();
    });
    expect(retried).toBe(false);
    await act(async () => {
      retried = await result.current.retry();
    });
    expect(retried).toBe(true);
  });

  it("does not post an empty or missing recording", async () => {
    const { result } = await mount();
    await act(() => result.current.start(1, 3));
    RNFS.stat.mockResolvedValue({ isFile: () => true, size: 0 });
    expect(await stopLine(result)).toEqual({ retry: "We didn't catch that. Say the line again." });
    RNFS.exists.mockResolvedValue(false);
    expect(await stopLine(result)).toEqual({ retry: "We didn't catch that. Say the line again." });
    expect(scoreRecording).not.toHaveBeenCalled();
  });

  it("shows the child plain words when the recorder fails, and logs the original", async () => {
    const failure = new Error("AVAudioSession error -50");
    mockRecorder.startRecorder.mockRejectedValue(failure);
    const { result } = await mount();
    let started;
    await act(async () => {
      started = await result.current.start(1, 3);
    });
    expect(started).toBe(false);
    expect(result.current.error).toBe(
      "We couldn't turn on the microphone. Check the app has permission and try again."
    );
    expect(logError).toHaveBeenCalledWith(expect.any(String), failure);
  });
});
