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

// Mock @react-navigation/native so useIsFocused/useNavigation don't require NavigationContainer
// The blur handler is captured so a test can leave the screen the way the app
// does, rather than only unmounting.
let mockBlurHandler = null;
jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => true,
  useNavigation: () => ({
    addListener: jest.fn((event, cb) => {
      if (event === "blur") mockBlurHandler = cb;
      return jest.fn();
    }),
  }),
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
      audioUrl: "https://example.com/track1.m4a",
      displayName: "Artist 1",
      lyricsUrl: "https://example.com/track1.json",
      trackLengthSec: 300,
      trackSizeMB: 5,
      remoteUrl: "https://example.com/track1.m4a",
    },
  ],
  currentPlaying: null,
  setCurrentPlaying: jest.fn(),
  isTracksLoading: false,
  addTrackToManifest: jest.fn(),
  isTrackDownloaded: jest.fn(() => false),
  manifestError: null,
  refetchManifest: jest.fn(),
  refreshManifestSilently: jest.fn(),
};

const mockUseAudioSyncScroll = jest.fn();

jest.mock("./hooks", () => ({
  useTrackPlayer: () => mockUseTrackPlayer,
  useAudioManifest: () => mockUseAudioManifest,
  useAudioSyncScroll: (...args) => mockUseAudioSyncScroll(...args),
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
        <Pressable
          testID="switch-track-button"
          onPress={() => props.handleTrackSelect(props.tracks?.[1] || props.tracks?.[0])}
        >
          <Text>Switch</Text>
        </Pressable>
        {/* The bar's own X. The real one saves progress first and then calls
            this, which is the path that dismisses the whole player. */}
        <Pressable testID="control-bar-close" onPress={props.onCloseTrackModal}>
          <Text>Close</Text>
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
    short: "Short",
    medium: "Medium",
    long: "Long",
    extra_long: "Extra Long",
  },
  constant: {
    SHORT: "SHORT",
    MEDIUM: "MEDIUM",
    LONG: "LONG",
    EXTRA_LONG: "EXTRA_LONG",
  },
  logError: jest.fn(),
  logMessage: jest.fn(),
  trackAudioEvent: jest.fn(),
  trackBaniOpen: jest.fn(),
  trackBaniListenCompletion: jest.fn(),
  trackAudioLinkRequest: jest.fn(),
  trackAudioStarted: jest.fn(() => Promise.resolve()),
  trackAudioCompleted: jest.fn(() => Promise.resolve()),
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
    mockUseAudioManifest.tracks = [
      {
        id: "track1",
        artistID: "artist1",
        audioUrl: "https://example.com/track1.m4a",
        displayName: "Artist 1",
        lyricsUrl: "https://example.com/track1.json",
        trackLengthSec: 300,
        trackSizeMB: 5,
        remoteUrl: "https://example.com/track1.m4a",
      },
    ];
    mockState = {
      // Pre-seed defaultAudio so the safe-exit effect doesn't false-positive
      // when currentPlaying is set (defaultAudioWiped check requires id to match).
      defaultAudio: {
        bani123: { id: "track1", artistID: "artist1" },
      },
      audioPlaybackSpeed: 1.0,
      isAudioAutoPlay: false,
    };
    mockUseTrackPlayer.isInitialized = true;
    mockUseTrackPlayer.isInitializing = false;
    mockUseTrackPlayer.isAudioEnabled = true;
    mockUseTrackPlayer.isPlaying = false;
    mockUseTrackPlayer.progress = { position: 0, duration: 100 };
    mockUseAudioManifest.currentPlaying = null;
    mockUseAudioManifest.isTracksLoading = false;
    mockUseAudioManifest.manifestError = null;
  });

  it("disables sync scroll in preview modal and enables it in full player", async () => {
    // Start with modal open so we can press track-track1
    mockState.defaultAudio = {};
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await waitFor(() => {
      expect(mockUseAudioSyncScroll).toHaveBeenCalledWith(
        mockUseTrackPlayer.progress,
        false,
        props.webViewRef,
        null,
        null
      );
    });

    mockUseTrackPlayer.isPlaying = true;
    mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];

    await act(async () => {
      fireEvent.press(getByTestId("track-track1"));
    });

    await waitFor(() => {
      expect(mockUseAudioSyncScroll).toHaveBeenCalledWith(
        mockUseTrackPlayer.progress,
        true,
        props.webViewRef,
        mockUseAudioManifest.tracks[0].lyricsUrl,
        null
      );
    });
  });

  it("gives the Reader its chrome back when the player is closed", async () => {
    const onShowBars = jest.fn();
    const props = createProps({ onShowBars });
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await act(async () => {
      fireEvent.press(getByTestId("control-bar-close"));
    });

    // Opening the player hides the bars; dismissing it must not leave the
    // reader on a bare page with no header and no tab bar.
    expect(onShowBars).toHaveBeenCalled();
  });

  it("does not require onShowBars — closing still works without one", async () => {
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await act(async () => {
      fireEvent.press(getByTestId("control-bar-close"));
    });

    expect(mockDispatch).toHaveBeenCalled();
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
    // Clear defaultAudio so hasSavedTrackForCurrentBani is false → modal starts open
    mockState.defaultAudio = {};
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);
    expect(getByTestId("audio-track-dialog")).toBeTruthy();
  });

  it("auto-starts the first track when Audio Auto Play is enabled", async () => {
    // Clear defaultAudio so hasSavedTrackForCurrentBani is false → modal starts open
    // (autoStartFirstTrack effect only runs when showTrackModal is true)
    mockState.defaultAudio = {};
    mockState.isAudioAutoPlay = true;
    const track = mockUseAudioManifest.tracks[0];
    const props = createProps();

    render(<AudioPlayer {...props} />);

    await waitFor(() => {
      expect(mockUseTrackPlayer.addAndPlayTrack).toHaveBeenCalledWith(
        track.id,
        track.audioUrl,
        "Test Bani",
        track.displayName,
        track.lyricsUrl,
        track.trackLengthSec,
        track.trackSizeMB,
        true, // isAudioAutoPlay is true in this test
        track.remoteUrl || track.audioUrl
      );
    });
  });

  it("renders AudioControlBar when showTrackModal is false", async () => {
    // With defaultAudio pre-seeded (hasSavedTrackForCurrentBani=true), the
    // AudioControlBar renders on mount without needing to press a track button.
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
    await waitFor(() => {
      expect(mockGetActiveTrack).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(mockUseTrackPlayer.addAndPlayTrack).toHaveBeenCalledWith(
          track.id,
          track.audioUrl,
          "Test Bani",
          track.displayName,
          track.lyricsUrl,
          track.trackLengthSec,
          track.trackSizeMB,
          true,
          track.remoteUrl || track.audioUrl
        );
      },
      { timeout: 1000 }
    );
  });

  it("calls handleSeek when seek button is pressed", async () => {
    // Start with modal open so we can press track-track1 to navigate to control bar
    mockState.defaultAudio = {};
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await act(async () => {
      fireEvent.press(getByTestId("track-track1"));
    });

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
    // Start with modal open so AudioTrackDialog shows track buttons
    mockState.defaultAudio = {};
    const selectedTrack = mockUseAudioManifest.tracks[0];
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    const trackButton = getByTestId(`track-${selectedTrack.id}`);
    await act(async () => {
      fireEvent.press(trackButton);
    });

    expect(mockUseAudioManifest.setCurrentPlaying).toHaveBeenCalledWith(selectedTrack);
    expect(mockUseTrackPlayer.stop).toHaveBeenCalled();
    expect(mockUseTrackPlayer.addAndPlayTrack).toHaveBeenCalledWith(
      selectedTrack.id,
      selectedTrack.audioUrl,
      "Test Bani",
      selectedTrack.displayName,
      selectedTrack.lyricsUrl,
      selectedTrack.trackLengthSec,
      selectedTrack.trackSizeMB,
      false, // isAudioAutoPlay is false in default test state
      selectedTrack.remoteUrl || selectedTrack.audioUrl
    );
  });

  it("switches and auto-plays with one tap when full player is already open", async () => {
    const track1 = mockUseAudioManifest.tracks[0];
    const track2 = {
      id: "track2",
      artistID: "artist2",
      audioUrl: "https://example.com/track2.m4a",
      displayName: "Artist 2",
      lyricsUrl: "https://example.com/track2.json",
      trackLengthSec: 210,
      trackSizeMB: 7,
      remoteUrl: "https://example.com/track2.m4a",
    };
    mockUseAudioManifest.tracks = [track1, track2];
    mockUseAudioManifest.currentPlaying = track1;

    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await waitFor(() => {
      expect(getByTestId("audio-control-bar")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId("switch-track-button"));
    });

    await waitFor(() => {
      expect(mockUseTrackPlayer.addAndPlayTrack).toHaveBeenCalledWith(
        track2.id,
        track2.audioUrl,
        "Test Bani",
        track2.displayName,
        track2.lyricsUrl,
        track2.trackLengthSec,
        track2.trackSizeMB,
        false, // isAudioAutoPlay is false in default test state
        track2.remoteUrl || track2.audioUrl
      );
    });
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

    // Ignore initial autoplay call from modal->player handoff.
    mockUseTrackPlayer.addAndPlayTrack.mockClear();

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
    mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
    const selectedTrack = {
      ...mockUseAudioManifest.tracks[0],
      id: "track2",
      displayName: "Artist 2",
    };
    mockUseAudioManifest.tracks = [mockUseAudioManifest.tracks[0], selectedTrack];
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    // Wait for control bar
    await waitFor(() => {
      expect(getByTestId("audio-control-bar")).toBeTruthy();
    });

    // Click switch track (this mock button directly calls handleTrackSelect)
    await act(async () => {
      fireEvent.press(getByTestId("switch-track-button"));
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

    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalled();
    });
  });

  it("handles errors in handleSeek gracefully", async () => {
    const { showErrorToast } = require("@common/toast");
    mockUseTrackPlayer.seekTo.mockRejectedValue(new Error("Seek error"));
    // Start with modal open so we can navigate to control bar via track selection
    mockState.defaultAudio = {};
    const props = createProps();
    const { getByTestId } = render(<AudioPlayer {...props} />);

    await act(async () => {
      fireEvent.press(getByTestId("track-track1"));
    });

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
    // Start with modal open so AudioTrackDialog shows track buttons
    mockState.defaultAudio = {};
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

  it("keeps preview modal open on entry even when currentPlaying exists", async () => {
    // When app first opens with no saved defaultAudio.id, showTrackModal defaults to true.
    // But the auto-restore effect will close the modal when both tracks and currentPlaying are present.
    // So when currentPlaying is set via rerender AFTER initial render, the modal closes automatically.
    mockState.defaultAudio = {};
    const props = createProps();
    const { queryByTestId, rerender } = render(<AudioPlayer {...props} />);

    // Initially, modal is open (no currentPlaying yet)
    expect(queryByTestId("audio-track-dialog")).toBeTruthy();

    // Simulate setting currentPlaying (e.g., from manifest loading).
    // In production, defaultAudio is also updated before currentPlaying is set
    // (via handleTrackSelect dispatching setDefaultAudio). Mirror that here to
    // prevent the safe-exit defaultAudioWiped false-positive.
    const track = mockUseAudioManifest.tracks[0];
    mockState.defaultAudio = { [props.baniID]: { id: track.id, artistID: track.artistID } };
    mockUseAudioManifest.currentPlaying = track;
    rerender(<AudioPlayer {...props} />);

    // After currentPlaying is set, the auto-restore effect closes the modal
    await waitFor(
      () => {
        expect(queryByTestId("audio-control-bar")).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });

  it("shows preview modal on entry even when defaultAudio exists (no saved track ID)", async () => {
    // hasSavedTrackForCurrentBani requires defaultAudio[baniID].id to be set.
    // Setting only audioUrl (no id) means modal starts open.
    // The auto-restore effect also requires hasCurrentTrack (currentPlaying.id) which is null here,
    // so the modal stays open until a track is explicitly selected.
    const props = createProps();
    mockState.defaultAudio = {
      [props.baniID]: {
        audioUrl: "https://example.com/track1.m4a",
        // no 'id' field, so hasSavedTrackForCurrentBani = false
      },
    };
    const { queryByTestId } = render(<AudioPlayer {...props} />);

    await waitFor(
      () => {
        expect(queryByTestId("audio-track-dialog")).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });

  it("unmounts without forcing audio toggle", async () => {
    const props = createProps();
    const { unmount } = render(<AudioPlayer {...props} />);

    await act(async () => {
      unmount();
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    expect(mockUseTrackPlayer.stop).not.toHaveBeenCalled();
  });

  describe("safe-exit on a refreshed list", () => {
    const remote = "https://example.com/artist1/track1.m4a";
    const local = "/data/user/0/app/files/audio/artist1/track1.m4a";
    const playing = (audioUrl, remoteUrl = remote) => ({
      id: "track1",
      artistID: "artist1",
      audioUrl,
      remoteUrl,
      displayName: "Artist 1",
      lyricsUrl: null,
      trackLengthSec: 300,
      trackSizeMB: 5,
    });

    const settle = async (props, { queryByTestId }) => {
      await waitFor(() => expect(queryByTestId("audio-control-bar")).toBeTruthy());
    };

    it("stays in the player when the same file merely turns from remote into local", async () => {
      const props = createProps();
      mockState.defaultAudio = { [props.baniID]: { id: "track1", artistID: "artist1" } };
      mockUseAudioManifest.currentPlaying = playing(remote);
      mockUseAudioManifest.tracks = [playing(remote)];
      const utils = render(<AudioPlayer {...props} />);
      await settle(props, utils);

      // The download got merged in: same file, now a local path.
      mockUseAudioManifest.tracks = [{ ...playing(local), isLocallyDownloaded: true }];
      utils.rerender(<AudioPlayer {...props} />);
      await act(async () => {
        await new Promise((r) => {
          setTimeout(r, 50);
        });
      });
      expect(utils.queryByTestId("audio-track-dialog")).toBeNull();
      expect(mockUseAudioManifest.setCurrentPlaying).not.toHaveBeenCalledWith(null);
    });

    it("still exits to the list when the artist now points at a different file", async () => {
      const props = createProps();
      mockState.defaultAudio = { [props.baniID]: { id: "track1", artistID: "artist1" } };
      mockUseAudioManifest.currentPlaying = playing(remote);
      mockUseAudioManifest.tracks = [playing(remote)];
      const utils = render(<AudioPlayer {...props} />);
      await settle(props, utils);

      const other = "https://example.com/artist1/track1-trimmed.m4a";
      mockUseAudioManifest.tracks = [playing(other, other)];
      utils.rerender(<AudioPlayer {...props} />);
      await waitFor(() =>
        expect(mockUseAudioManifest.setCurrentPlaying).toHaveBeenCalledWith(null)
      );
    });
  });

  // bani_listen_completion says how far into a track the reader got. It is only
  // true if they actually played it, and only meaningful if the position came
  // from the track it is filed under. It used to check neither, which is how it
  // ended up with MORE unique users than bani_listen — a strict subset of it.
  describe("bani_listen_completion", () => {
    // eslint-disable-next-line global-require
    const { trackBaniListenCompletion } = require("@common");

    const leave = async () => {
      const props = createProps();
      const { unmount } = render(<AudioPlayer {...props} />);
      await act(async () => {
        unmount();
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });
    };

    it("does not report a listen when the position was only restored", async () => {
      // Reopening a bani SEEKS to where you left off. Nothing has played, so
      // there is nothing to report — this exact case is what logged people who
      // never pressed play as having "completed" the track.
      mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
      mockUseTrackPlayer.isPlaying = false;
      mockUseTrackPlayer.progress = { position: 270, duration: 300 };

      await leave();

      expect(trackBaniListenCompletion).not.toHaveBeenCalled();
    });

    it("reports the position that was actually played, against RNTP own clock", async () => {
      // The manifest says 300s and RNTP says 301 — close enough to be the same
      // track, and RNTP is the one that produced the position, so the percentage
      // has to be computed against ITS duration rather than the estimate.
      mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
      mockUseTrackPlayer.isPlaying = true;
      mockUseTrackPlayer.progress = { position: 150, duration: 301 };

      await leave();

      expect(trackBaniListenCompletion).toHaveBeenCalledWith(
        "bani123",
        expect.anything(),
        "Artist 1",
        150,
        301
      );
    });

    it("ignores a position still belonging to the previous track", async () => {
      // While a newly chosen track loads, RNTP keeps reporting the old one.
      // Its DURATION gives it away: 92s is not this 300s track, so the position
      // beside it is not this track's either.
      mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
      mockUseTrackPlayer.isPlaying = true;
      mockUseTrackPlayer.progress = { position: 88, duration: 92 };

      await leave();

      expect(trackBaniListenCompletion).not.toHaveBeenCalled();
    });

    it("reports nothing at all when no track was ever chosen", async () => {
      mockUseAudioManifest.currentPlaying = null;
      mockUseTrackPlayer.isPlaying = false;
      mockUseTrackPlayer.progress = { position: 0, duration: 0 };

      await leave();

      expect(trackBaniListenCompletion).not.toHaveBeenCalled();
    });

    it("reports ONCE when the reader leaves and audio keeps playing", async () => {
      // Leaving fires on blur; the unmount safety-net fires again for the case
      // where blur never came. The guard between them used to be cleared by
      // every progress tick, so audio still running after the blur re-armed it
      // and one exit produced two events.
      mockUseAudioManifest.currentPlaying = mockUseAudioManifest.tracks[0];
      mockUseTrackPlayer.isPlaying = true;
      mockUseTrackPlayer.progress = { position: 150, duration: 300 };

      const props = createProps();
      const { unmount } = render(<AudioPlayer {...props} />);

      await act(async () => {
        mockBlurHandler(); // navigate away
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });
      await act(async () => {
        unmount(); // screen torn down afterwards
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      expect(trackBaniListenCompletion).toHaveBeenCalledTimes(1);
    });
  });
});
