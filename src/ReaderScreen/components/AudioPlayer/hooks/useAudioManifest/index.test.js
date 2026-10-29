/* eslint-env jest */

import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { setMockState, getMockDispatch } from "@common/test-utils/mocks/react-redux";
// eslint-disable-next-line import/order
import useAudioManifest from "./index";

// react-native-fs — control file existence/size for the downloaded-merge path.
jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/test/documents",
  exists: jest.fn(() => Promise.resolve(true)),
  stat: jest.fn(() => Promise.resolve({ size: 5000000 })),
  unlink: jest.fn(() => Promise.resolve()),
}));

jest.mock("@common", () => ({
  actions: {
    setAudioManifest: jest.fn((baniId, tracks) => ({
      type: "SET_AUDIO_MANIFEST",
      payload: { baniId, tracks },
    })),
    setAudioCatalogEntry: jest.fn((baniId, entry) => ({
      type: "SET_AUDIO_CATALOG_ENTRY",
      payload: { baniId, entry },
    })),
    removeDownloadEntries: jest.fn((keys) => ({ type: "REMOVE_DOWNLOAD_ENTRIES", payload: keys })),
  },
  logError: jest.fn(),
  logMessage: jest.fn(),
  STRINGS: { NETWORK_ERROR: "Network error", PLEASE_TRY_AGAIN: "Please try again" },
  // Optimistic default (online); individual tests override via mockReturnValue.
  useNetwork: jest.fn(() => ({ isOnline: true })),
}));

jest.mock("@service", () => ({
  fetchRawBaniAudio: jest.fn(),
  selectTracksForBani: jest.fn(),
}));

// The reconcile pass has its own suite; here it only needs to report "nothing
// changed" so the merge is not re-run behind the assertions.
jest.mock("@common/services/audioReconcile", () => ({
  reconcileDownloads: jest.fn(() => Promise.resolve({ changed: false })),
}));

const { useNetwork } = require("@common");
const { fetchRawBaniAudio, selectTracksForBani } = require("@service");

const AUDIO_DIR = "/test/documents/audio";

// One backend "intermediate" track (services/audioApi shape).
const intermediateTrack = (over = {}) => ({
  bani_id: 2,
  track_id: 1002,
  track_url: "https://cdn.example.net/audios/BhaiJarnailSingh/JapjiSahib.m4a",
  track_length_seconds: 985.5,
  track_size_mb: 15.39,
  artist_name: "Bhai Jarnail Singh",
  artist_id: 4,
  lyrics_url: "https://cdn.example.net/audios/BhaiJarnailSingh/japji-sahib.json",
  ...over,
});

const TestComponent = ({ baniID, onResult }) => {
  const result = useAudioManifest(baniID);
  React.useEffect(() => {
    if (onResult) onResult(result);
  }, [result, onResult]);
  return null;
};

const renderHook = (baniID) => {
  let hookResult;
  const utils = render(
    <TestComponent
      baniID={baniID}
      onResult={(result) => {
        hookResult = result;
      }}
    />
  );
  return { getResult: () => hookResult, ...utils };
};

describe("useAudioManifest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNetwork.mockReturnValue({ isOnline: true });
    setMockState({
      defaultAudio: {},
      audioManifest: {},
      audioCatalog: {},
      baniLength: "LONG",
      downloadRegistry: {},
      _persist: { rehydrated: true },
    });
  });

  it("fetches from the network when uncached, maps tracks, and persists the catalog entry", async () => {
    fetchRawBaniAudio.mockResolvedValueOnce({ groups: { long: {} }, baniName: "Japji Sahib" });
    selectTracksForBani.mockReturnValue([intermediateTrack()]);

    const { getResult, unmount } = renderHook(2);

    await waitFor(() => expect(fetchRawBaniAudio).toHaveBeenCalledWith(2));
    await waitFor(() => expect(getResult()?.isTracksLoading).toBe(false));

    expect(getResult().tracks).toHaveLength(1);
    expect(getResult().tracks[0]).toMatchObject({
      id: 1002,
      track_id: 1002,
      artistID: 4,
      audioUrl: "https://cdn.example.net/audios/BhaiJarnailSingh/JapjiSahib.m4a",
      remoteUrl: "https://cdn.example.net/audios/BhaiJarnailSingh/JapjiSahib.m4a",
      displayName: "Bhai Jarnail Singh",
      trackLengthSec: 985.5,
      trackSizeMB: 15.39,
      lyricsUrl: "https://cdn.example.net/audios/BhaiJarnailSingh/japji-sahib.json",
      isLocallyDownloaded: false,
    });

    // Persisted the raw groups for offline use.
    const dispatched = getMockDispatch().mock.calls.map(([a]) => a);
    expect(dispatched).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "SET_AUDIO_CATALOG_ENTRY",
          payload: expect.objectContaining({ baniId: 2 }),
        }),
      ])
    );
    unmount();
  });

  it("uses the persisted cache without any network call when fresh", async () => {
    setMockState({
      audioCatalog: { 2: { groups: { long: {} }, baniName: "Japji", fetchedAt: Date.now() } },
    });
    selectTracksForBani.mockReturnValue([intermediateTrack()]);

    const { getResult, unmount } = renderHook(2);

    await waitFor(() => expect(getResult()?.isTracksLoading).toBe(false));
    expect(getResult().tracks).toHaveLength(1);
    expect(fetchRawBaniAudio).not.toHaveBeenCalled();
    unmount();
  });

  it("refreshes from the network when the cached entry is stale", async () => {
    setMockState({
      audioCatalog: { 2: { groups: { long: {} }, baniName: "Japji", fetchedAt: 0 } },
    });
    fetchRawBaniAudio.mockResolvedValueOnce({ groups: { long: {} }, baniName: "Japji" });
    selectTracksForBani.mockReturnValue([intermediateTrack()]);

    const { unmount } = renderHook(2);

    await waitFor(() => expect(fetchRawBaniAudio).toHaveBeenCalledWith(2));
    unmount();
  });

  it("offline with nothing cached surfaces a network error and no tracks", async () => {
    useNetwork.mockReturnValue({ isOnline: false });

    const { getResult, unmount } = renderHook(2);

    await waitFor(() => expect(getResult()?.isTracksLoading).toBe(false));
    expect(getResult().tracks).toEqual([]);
    expect(getResult().manifestError).toBe("Network error");
    expect(fetchRawBaniAudio).not.toHaveBeenCalled();
    unmount();
  });

  it("offline WITH a cached entry plays from cache and never hits the network", async () => {
    useNetwork.mockReturnValue({ isOnline: false });
    setMockState({
      audioCatalog: { 2: { groups: { long: {} }, baniName: "Japji", fetchedAt: Date.now() } },
    });
    selectTracksForBani.mockReturnValue([intermediateTrack()]);

    const { getResult, unmount } = renderHook(2);

    await waitFor(() => expect(getResult()?.isTracksLoading).toBe(false));
    expect(getResult().tracks).toHaveLength(1);
    expect(getResult().manifestError).toBeNull();
    expect(fetchRawBaniAudio).not.toHaveBeenCalled();
    unmount();
  });

  it("online but the bani has no audio yields empty tracks with no error", async () => {
    fetchRawBaniAudio.mockResolvedValueOnce(null); // 404
    const { getResult, unmount } = renderHook(2);

    await waitFor(() => expect(getResult()?.isTracksLoading).toBe(false));
    expect(getResult().tracks).toEqual([]);
    expect(getResult().manifestError).toBeNull();
    unmount();
  });

  it("flags a length-variant bani with an empty length group as unavailable-for-length", async () => {
    setMockState({ baniLength: "EXTRA_LONG" });
    fetchRawBaniAudio.mockResolvedValueOnce({ groups: { short: {} }, baniName: "Chaupai" });
    selectTracksForBani.mockReturnValue([]); // XL group absent → empty

    const { getResult, unmount } = renderHook(9); // 9 is a length-variant bani

    await waitFor(() => expect(getResult()?.isTracksLoading).toBe(false));
    expect(getResult().tracks).toEqual([]);
    expect(getResult().isAudioUnavailableForCurrentLengthOnly).toBe(true);
    unmount();
  });

  it("merges a valid downloaded track as locally downloaded", async () => {
    const rnfs = require("react-native-fs");
    rnfs.exists.mockResolvedValue(true);
    rnfs.stat.mockResolvedValue({ size: 16 * 1024 * 1024 }); // >90% of 15.39MB → valid

    setMockState({
      audioManifest: {
        2: [
          {
            id: 1002,
            track_id: 1002,
            artistID: 4,
            audioUrl: "BhaiJarnailSingh/JapjiSahib.m4a",
            remoteUrl: "https://cdn.example.net/audios/BhaiJarnailSingh/JapjiSahib.m4a",
            displayName: "Bhai Jarnail Singh",
            trackLengthSec: 985.5,
            trackSizeMB: 15.39,
            lyricsUrl: "BhaiJarnailSingh/japji-sahib.json",
          },
        ],
      },
      audioCatalog: { 2: { groups: { long: {} }, baniName: "Japji", fetchedAt: Date.now() } },
    });
    selectTracksForBani.mockReturnValue([intermediateTrack()]);

    const { getResult, unmount } = renderHook(2);

    await waitFor(() => expect(getResult()?.isTracksLoading).toBe(false));
    const track = getResult().tracks[0];
    expect(track.isLocallyDownloaded).toBe(true);
    expect(track.audioUrl).toBe(`${AUDIO_DIR}/BhaiJarnailSingh/JapjiSahib.m4a`);
    expect(track.lyricsUrl).toBe(`${AUDIO_DIR}/BhaiJarnailSingh/japji-sahib.json`);
    unmount();
  });

  it("refetchManifest forces a network fetch even when the cache is fresh", async () => {
    setMockState({
      audioCatalog: { 2: { groups: { long: {} }, baniName: "Japji", fetchedAt: Date.now() } },
    });
    fetchRawBaniAudio.mockResolvedValue({ groups: { long: {} }, baniName: "Japji" });
    selectTracksForBani.mockReturnValue([intermediateTrack()]);

    const { getResult, unmount } = renderHook(2);
    await waitFor(() => expect(getResult()?.isTracksLoading).toBe(false));
    expect(fetchRawBaniAudio).not.toHaveBeenCalled(); // fresh cache → no fetch yet

    await getResult().refetchManifest();
    await waitFor(() => expect(fetchRawBaniAudio).toHaveBeenCalledWith(2));
    unmount();
  });
});

// A refetch while a reciter is playing must not disturb that reciter: the
// list opening now refetches every time, so this is the common case.
describe("refetch while playing", () => {
  const start = async () => {
    setMockState({
      defaultAudio: { 2: { id: 1002, artistID: 4 } },
      audioManifest: {},
      audioCatalog: {},
      baniLength: "LONG",
      downloadRegistry: {},
      _persist: { rehydrated: true },
    });
    fetchRawBaniAudio.mockResolvedValue({ groups: { long: {} }, baniName: "Japji Sahib" });
    selectTracksForBani.mockReturnValue([intermediateTrack()]);
    const hook = renderHook(2);
    await waitFor(() => expect(hook.getResult()?.currentPlaying?.id).toBe(1002));
    return hook;
  };

  it("keeps the very same playing object when nothing changed", async () => {
    const { getResult, unmount } = await start();
    const before = getResult().currentPlaying;
    const fetchesSoFar = fetchRawBaniAudio.mock.calls.length;
    await getResult().refreshManifestSilently();
    await waitFor(() => expect(fetchRawBaniAudio).toHaveBeenCalledTimes(fetchesSoFar + 1));
    expect(getResult().currentPlaying).toBe(before);
    unmount();
  });

  it("takes a corrected reciter name without touching the audio", async () => {
    const { getResult, unmount } = await start();
    const before = getResult().currentPlaying;
    selectTracksForBani.mockReturnValue([
      intermediateTrack({ artist_name: "Bhai Jarnail Singh Ji" }),
    ]);
    await getResult().refreshManifestSilently();
    await waitFor(() =>
      expect(getResult().currentPlaying.displayName).toBe("Bhai Jarnail Singh Ji")
    );
    expect(getResult().currentPlaying.audioUrl).toBe(before.audioUrl);
    expect(getResult().currentPlaying.id).toBe(before.id);
    unmount();
  });

  it("still adopts a different file for the artist (the other length variant)", async () => {
    const { getResult, unmount } = await start();
    const other = "https://cdn.example.net/audios/BhaiJarnailSingh/JapjiSahib-trimmed.m4a";
    selectTracksForBani.mockReturnValue([intermediateTrack({ track_url: other })]);
    await getResult().refreshManifestSilently();
    await waitFor(() => expect(getResult().currentPlaying.audioUrl).toBe(other));
    unmount();
  });
});
