/* eslint-env jest */
/* eslint-disable react/jsx-props-no-spreading */

import React from "react";

import { render, fireEvent, act, waitFor } from "@testing-library/react-native";

import AudioPlayer from "./index";

// -------------------- MOCKS --------------------

// Mock react-redux
let mockState;
const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selectorFn) => selectorFn(mockState),
}));

// Mock react-native-track-player
jest.mock("react-native-track-player", () => {
  const getActiveTrack = jest.fn();
  const mockTrackPlayer = { getActiveTrack };
  return {
    __esModule: true,
    getActiveTrack,
    default: mockTrackPlayer,
  };
});

const { getActiveTrack: mockGetActiveTrack } = require("react-native-track-player");

// Mock hooks
const mockUseTrackPlayer = {
  isPlaying: false,
  progress: { position: 0, duration: 100 },
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  addAndPlayTrack: jest.fn(),
  seekTo: jest.fn(),
  setRate: jest.fn(),
  isAudioEnabled: true,
  isInitialized: true,
  reset: jest.fn(),
  isInitializing: false,
  retryInitialization: jest.fn(),
};

const mockUseAudioManifest = {
  tracks: [
    {
      id: "track1",
      audioUrl: "https://example.com/track1.mp3",
      displayName: "Artist 1",
      lyricsUrl: "https://example.com/track1.json",
      trackLengthSec: 300,
      trackSizeMB: 5,
      remoteUrl: "https://example.com/track1.mp3",
    },
  ],
  currentPlaying: null,
  setCurrentPlaying: jest.fn(),
  isTracksLoading: false,
  addTrackToManifest: jest.fn(),
  isTrackDownloaded: jest.fn(() => false),
  manifestError: null,
  refetchManifest: jest.fn(),
};

jest.mock("./hooks", () => ({
  useTrackPlayer: () => mockUseTrackPlayer,
  useAudioManifest: () => mockUseAudioManifest,
  useAudioSyncScroll: jest.fn(),
}));

// Mock components
jest.mock("./components", () => {
  const { View, Text, Pressable } = require("react-native");
  return {
    AudioTrackDialog: ({ title, tracks, onCloseTrackModal, handleTrackSelect, ...props }) => (
      <View testID="audio-track-dialog" {...props}>
        <Text testID="dialog-title">{title}</Text>
        <Text testID="tracks-count">{tracks?.length || 0}</Text>
        <Pressable testID="close-dialog" onPress={onCloseTrackModal}>
          <Text>Close</Text>
        </Pressable>
        {tracks?.map((track) => (
          <Pressable
            key={track.id}
            testID={`track-${track.id}`}
            onPress={() => handleTrackSelect(track)}
          >
            <Text>{track.displayName}</Text>
          </Pressable>
        ))}
      </View>
    ),
    AudioControlBar: ({ title, isPlaying, handlePlayPause, handleSeek, ...props }) => (
      <View testID="audio-control-bar" {...props}>
        <Text testID="control-bar-title">{title}</Text>
        <Pressable testID="play-pause-button" onPress={handlePlayPause}>
          <Text>{isPlaying ? "Pause" : "Play"}</Text>
        </Pressable>
        <Pressable testID="seek-button" onPress={() => handleSeek(50)}>
          <Text>Seek</Text>
        </Pressable>
      </View>
    ),
    ErrorFallback: ({ title, buttonPress, buttonText, handleClose }) => (
      <View testID="error-fallback">
        <Text testID="error-title">{title}</Text>
        <Pressable testID="error-button" onPress={buttonPress}>
          <Text>{buttonText}</Text>
        </Pressable>
        <Pressable testID="error-close" onPress={handleClose}>
          <Text>Close</Text>
        </Pressable>
      </View>
    ),
    Loading: () => <View testID="loading">Loading...</View>,
  };
});

// Mock utils
jest.mock("./utils/getSequenceFromPosition", () => ({
  getSequenceFromPosition: jest.fn(() => Promise.resolve(1)),
}));

// Mock @common
jest.mock("@common/actions", () => ({
  toggleAudio: jest.fn((value) => ({ type: "TOGGLE_AUDIO", payload: value })),
  setDefaultAudio: jest.fn((track, baniID) => ({
    type: "SET_DEFAULT_AUDIO",
    track,
    baniID,
  })),
  setAudioProgress: jest.fn((baniID, trackId, position, sequence) => ({
    type: "SET_AUDIO_PROGRESS",
    baniID,
    trackId,
    position,
    sequence,
  })),
}));

jest.mock("@common/toast", () => ({
  showErrorToast: jest.fn(),
}));

jest.mock("@common", () => ({
  STRINGS: {
    INITIALIZING_AUDIO_PLAYER: "Initializing audio player...",
    NETWORK_ERROR: "Network error",
    RETRY: "Retry",
    WE_DO_NOT_HAVE_AUDIOS_FOR: "We do not have audios for",
    REQUEST_AUDIO_FOR_THIS_PAATH: "Request audio",
    UNABLE_TO_PLAY: "Unable to play",
    UNABLE_TO_SEEK: "Unable to seek",
    UNABLE_TO_SWITCH_TRACK: "Unable to switch track",
    PLEASE_TRY_AGAIN: "Please try again.",
  },
  logError: jest.fn(),
}));

// Mock Linking
const mockOpenURL = jest.fn(() => Promise.resolve());
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Linking = {
    ...RN.Linking,
    openURL: mockOpenURL,
  };
  return RN;
});

// -------------------- HELPERS --------------------

const createProps = (overrides = {}) => ({
  baniID: "bani123",
  title: "Test Bani",
  webViewRef: {
    current: {
      postMessage: jest.fn(),
    },
  },
  ...overrides,
});

// -------------------- TESTS --------------------

describe("AudioPlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveTrack.mockResolvedValue(null);
    mockState = {
      defaultAudio: {},
      audioPlaybackSpeed: 1.0,
    };
    mockUseTrackPlayer.isInitialized = true;
    mockUseTrackPlayer.isInitializing = false;
    mockUseTrackPlayer.isAudioEnabled = true;
    mockUseTrackPlayer.isPlaying = false;
    mockUseAudioManifest.tracks = [
      {
        id: "track1",
        audioUrl: "https://example.com/track1.mp3",
        displayName: "Artist 1",
        lyricsUrl: "https://example.com/track1.json",
        trackLengthSec: 300,
        trackSizeMB: 5,
        remoteUrl: "https://example.com/track1.mp3",
      },
    ];
    mockUseAudioManifest.currentPlaying = null;
    mockUseAudioManifest.isTracksLoading = false;
    mockUseAudioManifest.manifestError = null;
  });

  it("renders loading state when initializing", () => {
    mockUseTrackPlayer.isInitializing = true;
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);
    expect(getByTestId("loading")).toBeTruthy();
  });

  it("renders loading state when tracks are loading", () => {
    mockUseAudioManifest.isTracksLoading = true;
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);
    expect(getByTestId("loading")).toBeTruthy();
  });

  it("renders error fallback when not initialized and not initializing", () => {
    mockUseTrackPlayer.isInitialized = false;
    mockUseTrackPlayer.isInitializing = false;
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);
    expect(getByTestId("error-fallback")).toBeTruthy();
    expect(getByTestId("error-title").props.children).toBe("Initializing audio player...");
  });

  it("renders error fallback when manifest error occurs", () => {
    mockUseAudioManifest.manifestError = "Network error";
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);
    expect(getByTestId("error-fallback")).toBeTruthy();
    expect(getByTestId("error-title").props.children).toBe("Network error");
  });

  it("renders AudioTrackDialog when showTrackModal is true", () => {
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);
    expect(getByTestId("audio-track-dialog")).toBeTruthy();
  });

  it("renders AudioControlBar when showTrackModal is false", async () => {
    mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);
    await waitFor(() => {
      expect(getByTestId("audio-control-bar")).toBeTruthy();
    });
  });

  it("renders error fallback when no tracks available", () => {
    mockUseAudioManifest.tracks = [];
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);
    expect(getByTestId("error-fallback")).toBeTruthy();
    expect(getByTestId("error-title").props.children).toBe("We do not have audios for");
  });

  it("calls handlePlayPause when play button is pressed", async () => {
    const track = mockUseAudioManifest.tracks[0];
    mockUseAudioManifest.currentPlaying = track;
    mockGetActiveTrack.mockResolvedValue(null);
    mockUseTrackPlayer.isInitialized = true;
    mockUseTrackPlayer.isAudioEnabled = true;
    mockUseTrackPlayer.isPlaying = false;
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await waitFor(() => {
      expect(getByTestId("audio-control-bar")).toBeTruthy();
    });

    const playButton = getByTestId("play-pause-button");
    fireEvent.press(playButton);

    // Wait for async operations including getActiveTrack call
    expect(mockGetActiveTrack).toHaveBeenCalled();

    await waitFor(
      () => {
        expect(mockUseTrackPlayer.addAndPlayTrack).toHaveBeenCalledWith(
          track.id,
          track.audioUrl,
          track.displayName,
          track.displayName,
          track.lyricsUrl,
          track.trackLengthSec,
          track.trackSizeMB,
          track.remoteUrl || track.audioUrl
        );
      },
      { timeout: 1000 }
    );
  });

  it("calls handleSeek when seek button is pressed", async () => {
    mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await waitFor(() => {
      expect(getByTestId("audio-control-bar")).toBeTruthy();
    });

    const seekButton = getByTestId("seek-button");
    await act(async () => {
      fireEvent.press(seekButton);
    });

    expect(mockUseTrackPlayer.seekTo).toHaveBeenCalledWith(50);
  });

  it("handles track selection correctly", async () => {
    const selectedTrack = mockUseAudioManifest.tracks[0];
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    const trackButton = getByTestId(`track-${selectedTrack.id}`);
    await act(async () => {
      fireEvent.press(trackButton);
    });

    expect(mockUseAudioManifest.setCurrentPlaying).toHaveBeenCalledWith(selectedTrack);
    expect(mockUseTrackPlayer.stop).toHaveBeenCalled();
  });

  it("applies audio playback speed when initialized", async () => {
    mockState.audioPlaybackSpeed = 1.5;
    const props = createProps();
    render(<AudioPlayer {...props} />);

    await waitFor(() => {
      expect(mockUseTrackPlayer.setRate).toHaveBeenCalledWith(1.5);
    });
  });

  it("handles play when track is already loaded", async () => {
    const track = mockUseAudioManifest.tracks[0];
    mockUseAudioManifest.currentPlaying = track;
    // Mock getActiveTrack to return the same track ID
    mockGetActiveTrack.mockResolvedValue({ id: track.id });
    mockUseTrackPlayer.isInitialized = true;
    mockUseTrackPlayer.isAudioEnabled = true;
    mockUseTrackPlayer.isPlaying = false; // Not playing, so it should play
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await waitFor(() => {
      expect(getByTestId("audio-control-bar")).toBeTruthy();
    });

    const playButton = getByTestId("play-pause-button");
    await act(async () => {
      fireEvent.press(playButton);
      // Wait for async operations
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    await waitFor(() => {
      expect(mockGetActiveTrack).toHaveBeenCalled();
      expect(mockUseTrackPlayer.play).toHaveBeenCalled();
      expect(mockUseTrackPlayer.addAndPlayTrack).not.toHaveBeenCalled();
    });
  });

  it("handles pause correctly", async () => {
    mockUseTrackPlayer.isPlaying = true;
    mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await waitFor(() => {
      expect(getByTestId("audio-control-bar")).toBeTruthy();
    });

    const playButton = getByTestId("play-pause-button");
    await act(async () => {
      fireEvent.press(playButton);
    });

    expect(mockUseTrackPlayer.pause).toHaveBeenCalled();
  });

  it("saves audio progress when switching tracks", async () => {
    const { setAudioProgress } = require("@common/actions");
    mockUseTrackPlayer.progress = { position: 100, duration: 300 };
    const selectedTrack = {
      ...mockUseAudioManifest.tracks[0],
      lyricsUrl: "https://example.com/track1.json",
    };
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    const trackButton = getByTestId(`track-${selectedTrack.id}`);
    await act(async () => {
      fireEvent.press(trackButton);
    });

    await waitFor(() => {
      expect(setAudioProgress).toHaveBeenCalled();
    });
  });

  it("does not play when audio is disabled", async () => {
    mockUseTrackPlayer.isAudioEnabled = false;
    mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await waitFor(() => {
      expect(getByTestId("audio-control-bar")).toBeTruthy();
    });

    const playButton = getByTestId("play-pause-button");
    await act(async () => {
      fireEvent.press(playButton);
    });

    expect(mockUseTrackPlayer.addAndPlayTrack).not.toHaveBeenCalled();
  });

  it("handles errors in handlePlayPause gracefully", async () => {
    const { showErrorToast } = require("@common/toast");
    mockUseTrackPlayer.addAndPlayTrack.mockRejectedValue(new Error("Playback error"));
    mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
    mockGetActiveTrack.mockResolvedValue(null);
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await waitFor(() => {
      expect(getByTestId("audio-control-bar")).toBeTruthy();
    });

    const playButton = getByTestId("play-pause-button");
    await act(async () => {
      fireEvent.press(playButton);
    });

    expect(showErrorToast).toHaveBeenCalled();
  });

  it("handles errors in handleSeek gracefully", async () => {
    const { showErrorToast } = require("@common/toast");
    mockUseTrackPlayer.seekTo.mockRejectedValue(new Error("Seek error"));
    mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await waitFor(() => {
      expect(getByTestId("audio-control-bar")).toBeTruthy();
    });

    const seekButton = getByTestId("seek-button");
    await act(async () => {
      fireEvent.press(seekButton);
    });

    expect(showErrorToast).toHaveBeenCalled();
  });

  it("handles errors in handleTrackSelect gracefully", async () => {
    const { showErrorToast } = require("@common/toast");
    // Mock stop to reject
    mockUseTrackPlayer.stop.mockImplementationOnce(() => Promise.reject(new Error("Stop error")));
    const selectedTrack = mockUseAudioManifest.tracks[0];
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    const trackButton = getByTestId(`track-${selectedTrack.id}`);
    await act(async () => {
      fireEvent.press(trackButton);
    });

    await waitFor(
      () => {
        expect(showErrorToast).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it("closes modal when currentPlaying is set", async () => {
    const props = createProps();
    const { queryByTestId, rerender } = render(<AudioPlayer {...props} />);

    expect(queryByTestId("audio-track-dialog")).toBeTruthy();

    // Simulate setting currentPlaying
    mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
    rerender(<AudioPlayer {...props} />);

    await waitFor(
      () => {
        expect(queryByTestId("audio-control-bar")).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });

  it("closes modal when defaultAudio is set", async () => {
    const props = createProps();
    mockState.defaultAudio = {
      [props.baniID]: {
        audioUrl: "https://example.com/track1.mp3",
      },
    };
    const { queryByTestId } = render(<AudioPlayer {...props} />);

    await waitFor(
      () => {
        expect(queryByTestId("audio-control-bar")).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });

  it("stops audio and toggles audio off on unmount", async () => {
    const props = createProps();
    const { unmount } = render(<AudioPlayer {...props} />);

    await act(async () => {
      unmount();
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    expect(mockUseTrackPlayer.stop).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });
});
