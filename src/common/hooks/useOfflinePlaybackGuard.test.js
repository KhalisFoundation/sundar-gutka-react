import TrackPlayer from "react-native-track-player";
import { renderHook, act } from "@testing-library/react-native";
import { showErrorToast } from "../toast";
import { pauseTrack } from "../TrackPlayerUtils";
import useOfflinePlaybackGuard from "./useOfflinePlaybackGuard";

// A stream that loses its connection is paused (resumable), and the user is
// told why. A downloaded track, or one already paused, is left alone and quiet.

let mockNetwork = { isConnected: true };
jest.mock("../context", () => ({ useNetwork: () => mockNetwork }));
jest.mock("../toast", () => ({ showErrorToast: jest.fn() }));
jest.mock("../TrackPlayerUtils", () => ({ pauseTrack: jest.fn(() => Promise.resolve()) }));
jest.mock("../localization", () => ({ NETWORK_ERROR: "Network error" }));

const streaming = { url: "https://cdn.example.org/japji.mp3" };

const goOffline = async (rerender) => {
  mockNetwork = { isConnected: false };
  rerender();
  await act(async () => {
    jest.advanceTimersByTime(4000);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockNetwork = { isConnected: true };
  TrackPlayer.getActiveTrack = jest.fn(() => Promise.resolve(streaming));
  TrackPlayer.getPlaybackState = jest.fn(() => Promise.resolve({ state: "playing" }));
});

afterEach(() => jest.useRealTimers());

describe("useOfflinePlaybackGuard", () => {
  it("pauses a playing stream and says why", async () => {
    const { rerender } = renderHook(() => useOfflinePlaybackGuard());
    await goOffline(rerender);

    expect(pauseTrack).toHaveBeenCalledTimes(1);
    expect(showErrorToast).toHaveBeenCalledWith("Network error");
  });

  it("stays quiet when the stream was already paused", async () => {
    TrackPlayer.getPlaybackState = jest.fn(() => Promise.resolve({ state: "paused" }));
    const { rerender } = renderHook(() => useOfflinePlaybackGuard());
    await goOffline(rerender);

    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("leaves a downloaded track playing", async () => {
    TrackPlayer.getActiveTrack = jest.fn(() => Promise.resolve({ url: "/data/japji.mp3" }));
    const { rerender } = renderHook(() => useOfflinePlaybackGuard());
    await goOffline(rerender);

    expect(pauseTrack).not.toHaveBeenCalled();
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("does nothing when the connection returns before the delay", async () => {
    const { rerender } = renderHook(() => useOfflinePlaybackGuard());
    mockNetwork = { isConnected: false };
    rerender();
    mockNetwork = { isConnected: true };
    rerender();
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    expect(pauseTrack).not.toHaveBeenCalled();
  });
});
