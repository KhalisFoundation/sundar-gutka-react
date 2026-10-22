import { renderHook, waitFor } from "@testing-library/react-native";
import useStorageMigration from "./useStorageMigration";

// The previous release saved downloads as audio/<Artist>/<file>.m4a with no
// registry. They must be adopted into the registry in place, or the reconcile
// pass deletes them as orphans — and the migration may only be marked done once
// every directory was actually read.

const AUDIO = "/docs/audio";
let mockDirs;
let mockState;
const mockDispatch = jest.fn();

jest.mock("react-native-fs", () => ({
  exists: jest.fn((p) => Promise.resolve(p === "/docs/audio")),
  readDir: jest.fn((p) =>
    mockDirs[p] instanceof Error ? Promise.reject(mockDirs[p]) : Promise.resolve(mockDirs[p] || [])
  ),
}));
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useStore: () => ({ getState: () => mockState }),
}));
jest.mock("@common", () => ({ logError: jest.fn(), logMessage: jest.fn() }));
jest.mock("../../ReaderScreen/components/AudioPlayer/utils/audioDownloader", () => ({
  AUDIO_DIRECTORY_PATH: "/docs/audio",
}));
jest.mock("../actions", () => ({
  addDownloadEntry: (entry) => ({ type: "ADD_DOWNLOAD_ENTRY", payload: entry }),
  markAudioStorageMigrated: () => ({ type: "MARK_AUDIO_STORAGE_MIGRATED" }),
}));

const file = (name, size = 1048576) => ({
  name,
  path: `${AUDIO}/BhaiJarnailSingh/${name}`,
  size,
});
const adopted = () =>
  mockDispatch.mock.calls.map(([a]) => a).filter((a) => a.type === "ADD_DOWNLOAD_ENTRY");
const marked = () =>
  mockDispatch.mock.calls.some(([a]) => a.type === "MARK_AUDIO_STORAGE_MIGRATED");
const settle = () =>
  new Promise((r) => {
    setTimeout(r, 0);
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockState = { downloadRegistry: {}, audioStorageMigrated: false };
  mockDirs = {
    [AUDIO]: [
      { name: "BhaiJarnailSingh", path: `${AUDIO}/BhaiJarnailSingh`, isDirectory: () => true },
    ],
    [`${AUDIO}/BhaiJarnailSingh`]: [file("japji.m4a"), file("japji.json", 10), file("rehras.m4a")],
  };
});

describe("useStorageMigration", () => {
  it("adopts the previous release's downloads in place, lyrics included", async () => {
    renderHook(() => useStorageMigration());
    await waitFor(() => expect(marked()).toBe(true));

    expect(
      adopted()
        .map((a) => a.payload.relativePath)
        .sort()
    ).toEqual(["BhaiJarnailSingh/japji.m4a", "BhaiJarnailSingh/rehras.m4a"]);
    const japji = adopted().find((a) => a.payload.relativePath.endsWith("japji.m4a")).payload;
    expect(japji).toMatchObject({
      artistDisplayName: "Bhai Jarnail Singh",
      hasLyrics: true,
      sizeBytes: 0,
    });
  });

  it("leaves entries the registry already has alone", async () => {
    mockState.downloadRegistry = {
      "BhaiJarnailSingh/japji.m4a": { relativePath: "BhaiJarnailSingh/japji.m4a" },
    };
    renderHook(() => useStorageMigration());
    await waitFor(() => expect(marked()).toBe(true));

    expect(adopted().map((a) => a.payload.relativePath)).toEqual(["BhaiJarnailSingh/rehras.m4a"]);
  });

  it("runs once per install", async () => {
    mockState.audioStorageMigrated = true;
    renderHook(() => useStorageMigration());
    await settle();

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it.each([
    ["the audio directory", AUDIO],
    ["an artist directory", `${AUDIO}/BhaiJarnailSingh`],
  ])("is not marked done when %s cannot be read", async (_what, dir) => {
    mockDirs[dir] = new Error("EIO");
    renderHook(() => useStorageMigration());
    await settle();
    await settle();

    expect(marked()).toBe(false);
  });
});
