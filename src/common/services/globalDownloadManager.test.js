import { act, renderHook } from "@testing-library/react-native";
import useGlobalDownloadManager, { downloadControls } from "./globalDownloadManager";

// The download engine against a mocked native downloader, network and store.

let mockState;
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (select) => select(mockState),
}));

let mockExisting;
const mockTask = () => {
  const task = { id: "t1", state: "PENDING" };
  ["begin", "progress", "done", "error"].forEach((k) => {
    task[k] = jest.fn(() => task);
  });
  task.start = jest.fn();
  task.stop = jest.fn(() => Promise.resolve());
  return task;
};
const mockCreateDownloadTask = jest.fn(() => mockTask());
jest.mock("@kesha-antonov/react-native-background-downloader", () => ({
  createDownloadTask: (...a) => mockCreateDownloadTask(...a),
  getExistingDownloadTasks: () => mockExisting,
  completeHandler: jest.fn(),
  setConfig: jest.fn(),
}));

let mockNetInfoState;
let mockNetListener;
jest.mock("@react-native-community/netinfo", () => ({
  fetch: () => Promise.resolve(mockNetInfoState),
  addEventListener: (fn) => {
    mockNetListener = fn;
    return () => {};
  },
}));

const mockUnlink = jest.fn(() => Promise.resolve());
jest.mock("react-native-fs", () => ({
  exists: jest.fn(() => Promise.resolve(false)),
  stat: jest.fn(() => Promise.resolve({ size: 0 })),
  unlink: (...a) => mockUnlink(...a),
  readDir: jest.fn(() => Promise.resolve([])),
  getFSInfo: jest.fn(() => Promise.resolve({ freeSpace: 10 * 1024 ** 3 })),
}));

jest.mock("@common", () => ({
  logNetworkError: jest.fn(),
  logMessage: jest.fn(),
  trackTrackDownload: jest.fn(),
  showSuccessToast: jest.fn(),
  requestNotificationPermission: jest.fn(() => Promise.resolve(true)),
  STRINGS: {},
}));

jest.mock("../../ReaderScreen/components/AudioPlayer/utils/audioDownloader", () => ({
  AUDIO_DIRECTORY_PATH: "/doc/audio",
  downloadLyricsOnly: jest.fn(() => Promise.resolve()),
  ensureArtistDirectory: jest.fn(() => Promise.resolve()),
}));

jest.mock("../actions", () => ({
  updateDownloadStatus: (trackKey, status, extra = {}) => ({
    type: "UPDATE_DOWNLOAD_STATUS",
    payload: { trackKey, status, ...extra },
  }),
  updateDownloadProgress: (trackKey, progress) => ({
    type: "UPDATE_DOWNLOAD_PROGRESS",
    payload: { trackKey, progress },
  }),
  removeDownloadQueueEntry: (trackKey) => ({
    type: "REMOVE_DOWNLOAD_QUEUE_ENTRY",
    payload: { trackKey },
  }),
  requeuePausedDownloads: (statuses) => ({
    type: "REQUEUE_PAUSED_DOWNLOADS",
    payload: { statuses },
  }),
  addDownloadEntry: (entry) => ({ type: "ADD_DOWNLOAD_ENTRY", payload: entry }),
  enqueueDownload: (payload) => ({ type: "ENQUEUE_DOWNLOAD", payload }),
}));

const KEY = "BhaiJarnailSingh/JapjiSahib.m4a";
const URL = `https://cdn.example.org/audios/${KEY}`;
const queued = (over = {}) => ({
  [KEY]: {
    trackKey: KEY,
    audioUrl: URL,
    displayName: "Bhai Jarnail Singh",
    status: "queued",
    ...over,
  },
});

const flush = () =>
  act(async () => {
    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- let chained promises settle
      await Promise.resolve();
    }
  });

const dispatchedOf = (type) =>
  mockDispatch.mock.calls.map(([a]) => a).filter((a) => a.type === type);

beforeEach(() => {
  jest.clearAllMocks();
  // Reattach races a 10s timeout, and stall/retry timers run for seconds.
  jest.useFakeTimers();
  mockExisting = Promise.resolve([]);
  mockNetInfoState = { isConnected: true, type: "wifi" };
  mockState = { downloadQueue: {}, downloadWifiOnly: true, downloadRegistry: {} };
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("useGlobalDownloadManager", () => {
  it("starts nothing until reattach has adopted last session's tasks", async () => {
    let finishReattach;
    mockExisting = new Promise((resolve) => {
      finishReattach = resolve;
    });
    mockState.downloadQueue = queued();
    renderHook(() => useGlobalDownloadManager());
    await flush();
    expect(mockCreateDownloadTask).not.toHaveBeenCalled();

    finishReattach([]);
    await flush();
    expect(mockCreateDownloadTask).toHaveBeenCalledTimes(1);
  });

  it("does not treat ethernet or other non-cellular connections as metered", async () => {
    mockNetInfoState = { isConnected: true, type: "ethernet" };
    mockState.downloadQueue = queued();
    renderHook(() => useGlobalDownloadManager());
    await flush();

    expect(mockCreateDownloadTask).toHaveBeenCalledTimes(1);
    expect(
      dispatchedOf("UPDATE_DOWNLOAD_STATUS").some((a) => a.payload.status === "paused_wifi_only")
    ).toBe(false);
  });

  it("re-queues failed downloads only when coming back to an allowed network", async () => {
    renderHook(() => useGlobalDownloadManager());
    await flush();

    // Still on Wi-Fi: an ordinary event must not reset a permanent failure.
    act(() => mockNetListener({ isConnected: true, type: "wifi" }));
    expect(dispatchedOf("REQUEUE_PAUSED_DOWNLOADS").at(-1).payload.statuses).not.toContain(
      "failed"
    );

    // Blocked (cellular with Wi-Fi-only on), then allowed again: heal.
    act(() => mockNetListener({ isConnected: true, type: "cellular" }));
    act(() => mockNetListener({ isConnected: true, type: "wifi" }));
    expect(dispatchedOf("REQUEUE_PAUSED_DOWNLOADS").at(-1).payload.statuses).toContain("failed");
  });

  it("stops transfers when Wi-Fi-only is switched on over cellular", async () => {
    mockNetInfoState = { isConnected: true, type: "cellular" };
    mockState.downloadWifiOnly = false;
    mockState.downloadQueue = queued({ status: "downloading" });
    const { rerender } = renderHook(() => useGlobalDownloadManager());
    await flush();
    mockDispatch.mockClear();

    mockState = { ...mockState, downloadWifiOnly: true };
    rerender();
    await flush();
    expect(dispatchedOf("UPDATE_DOWNLOAD_STATUS").map((a) => a.payload)).toContainEqual({
      trackKey: KEY,
      status: "paused_wifi_only",
    });
  });

  it("cancel keeps a file that has already been finalized", async () => {
    mockState.downloadQueue = queued({ status: "completed" });
    renderHook(() => useGlobalDownloadManager());
    await flush();

    await act(() => downloadControls.cancel(KEY));
    expect(mockUnlink).not.toHaveBeenCalled();
    expect(dispatchedOf("REMOVE_DOWNLOAD_QUEUE_ENTRY")).toHaveLength(1);
  });

  it("cancel removes a partial file that is not registered", async () => {
    mockState.downloadQueue = queued({ status: "paused_no_network" });
    renderHook(() => useGlobalDownloadManager());
    await flush();

    await act(() => downloadControls.cancel(KEY));
    expect(mockUnlink).toHaveBeenCalledWith(`/doc/audio/${KEY}`);
  });

  it("creates no task for a download cancelled while its start was waiting", async () => {
    const common = jest.requireMock("@common");
    let answerPrompt;
    common.requestNotificationPermission.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          answerPrompt = resolve;
        })
    );
    mockState.downloadQueue = queued();
    renderHook(() => useGlobalDownloadManager());
    await flush();
    expect(answerPrompt).toBeDefined();

    // The user cancels while the notification prompt is still up.
    await act(() => downloadControls.cancel(KEY));
    answerPrompt(true);
    await flush();

    expect(mockCreateDownloadTask).not.toHaveBeenCalled();
  });

  it("downloads again over a partial file instead of registering it", async () => {
    // Android writes straight into the destination, so a transfer killed
    // part-way leaves a partial file where a finished one would be.
    const fs = jest.requireMock("react-native-fs");
    fs.exists.mockImplementation((p) => Promise.resolve(p === `/doc/audio/${KEY}`));
    fs.stat.mockResolvedValue({ size: 4 * 1024 * 1024 });
    mockState.downloadQueue = queued();
    renderHook(() => useGlobalDownloadManager());
    await flush();

    expect(mockUnlink).toHaveBeenCalledWith(`/doc/audio/${KEY}`);
    expect(dispatchedOf("ADD_DOWNLOAD_ENTRY")).toHaveLength(0);
    expect(mockCreateDownloadTask).toHaveBeenCalledTimes(1);
    fs.exists.mockImplementation(() => Promise.resolve(false));
  });

  it("creates no task when the entry was paused while its start was waiting", async () => {
    const common = jest.requireMock("@common");
    let answerPrompt;
    common.requestNotificationPermission.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          answerPrompt = resolve;
        })
    );
    mockState.downloadQueue = queued();
    const { rerender } = renderHook(() => useGlobalDownloadManager());
    await flush();

    // The network drops: the listener marks the entry paused.
    mockState = { ...mockState, downloadQueue: queued({ status: "paused_no_network" }) };
    rerender();
    answerPrompt(true);
    await flush();

    expect(mockCreateDownloadTask).not.toHaveBeenCalled();
  });
});
