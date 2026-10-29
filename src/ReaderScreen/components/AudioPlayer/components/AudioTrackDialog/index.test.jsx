/* eslint-env jest */
/* eslint-disable react/jsx-props-no-spreading */

import React from "react";
import TrackPlayer from "react-native-track-player";

import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

import AudioTrackDialog from "./index";

// -------------------- MOCKS --------------------

let mockState = { fontFace: "TestFont" };

jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => true,
}));

jest.mock("react-redux", () => ({
  useSelector: (selector) => selector(mockState),
}));

jest.mock("@common/context", () => ({
  __esModule: true,
  default: () => ({
    theme: {
      mode: "light",
      // Native-prop enums that the theme decides. This suite stubs `@common`,
      // so it cannot require the real theme (which reads `constant` for its
      // font names) and states them directly instead.
      chrome: { statusBarStyle: "dark-content", scrollIndicator: "black", blurType: "light" },
      c: require("@theme/semanticColors").light,

      colors: {
        primary: "#123456",
        audioTitleText: "#111111",
        transparentOverlay: "rgba(0,0,0,0.5)",
      },
      staticColors: {
        WHITE_COLOR: "#FFFFFF",
      },
    },
  }),
  useNetwork: () => ({ isOffline: false, isOnline: true }),
}));

const mockStyles = {
  modalWrapper: { padding: 0 },
  container: {},
  containerIOS: {},
  containerAndroid: {},
  blurOverlay: {},
  closeButton: {},
  header: {},
  welcomeText: {},
  subtitleText: {},
  loadingContainer: {},
  noTracksContainer: {},
  noTracksText: {},
  noTracksSubtext: {},
  joinMailingListButton: {},
  joinMailingListText: {},
  playButton: {},
  playButtonDisabled: { opacity: 0.5 },
  playButtonText: {},
};

jest.mock("@common/hooks/useThemedStyles", () => () => () => mockStyles);

jest.mock("@common/icons", () => {
  const { Text } = require("react-native");
  return {
    ArrowRightIcon: (props) => <Text testID="arrow-icon" {...props} />,
    CloseIcon: (props) => <Text testID="close-icon" {...props} />,
  };
});

jest.mock("@common", () => {
  const { Text } = require("react-native");
  return {
    STRINGS: {
      MAAFI_JI: "Maafi Ji",
      WE_DO_NOT_HAVE_AUDIOS_FOR: "We do not have audios for",
      YET: "yet",
      REQUEST_AUDIO_FOR_THIS_PAATH: "Request audio for this paath",
      NEXT: "Next",
      welcome_to_sundar_gutka: "Welcome to Sundar Gutka",
      please_choose_a_track: "Please choose a track for",
      OPENING_PLAYER: "Opening Player...",
      OFFLINE_TRACKS_NOTICE: "You're offline.",
    },
    CustomText: ({ children, ...props }) => (
      <Text accessibilityRole="text" {...props}>
        {children}
      </Text>
    ),
    Coachmark: ({ children }) => children,
    PREVIEW_STEPS: [],
    COACH: { HOME: "home", PREVIEW: "preview", PLAYER: "player", DOWNLOADS: "downloads" },
  };
});

jest.mock("@react-native-community/blur", () => {
  const { View } = require("react-native");
  return {
    BlurView: (props) => <View testID="blur-view" {...props} />,
  };
});

jest.mock("@react-native-community/netinfo", () => ({
  useNetInfo: () => ({ isConnected: true, type: "wifi" }),
}));

jest.mock("../ScrollViewComponent", () => {
  const { View, Pressable, Text } = require("react-native");
  // `header` is rendered INSIDE the scroller by the real component, so that the
  // intro scrolls with the rows instead of pushing them and Next off the card
  // at a raised OS text size. The stub has to honour that or the dialog's own
  // header assertions would pass against a component that never showed it.
  const Comp = ({ tracks, handleSelectTrack, previewLoadingTrackId, header }) => (
    <View testID="tracks-list">
      {header}
      <Text testID="preview-loading-id">{previewLoadingTrackId || ""}</Text>
      {tracks.map((track) => (
        <Pressable
          key={track.id}
          testID={`track-${track.id}`}
          onPress={() => handleSelectTrack(track)}
        >
          <Text>{track.displayName}</Text>
        </Pressable>
      ))}
    </View>
  );
  return { __esModule: true, default: Comp, isOfflineAvailable: () => true };
});

// -------------------- HELPERS --------------------

const defaultTracks = [
  {
    id: "track-1",
    displayName: "Track One",
    audioUrl: "https://example.com/track-1.m4a",
    lyricsUrl: "https://example.com/track-1.json",
    remoteUrl: "https://example.com/track-1.m4a",
    trackLengthSec: 100,
    trackSizeMB: 2.5,
  },
  {
    id: "track-2",
    displayName: "Track Two",
    audioUrl: "https://example.com/track-2.m4a",
    lyricsUrl: "https://example.com/track-2.json",
    remoteUrl: "https://example.com/track-2.m4a",
    trackLengthSec: 120,
    trackSizeMB: 3.1,
  },
];

const createProps = (overrides = {}) => ({
  handleTrackSelect: jest.fn(() => Promise.resolve()),
  title: "Gutka",
  tracks: defaultTracks,
  onCloseTrackModal: jest.fn(),
  isHeader: true,
  isFooter: true,
  isLoading: false,
  addAndPlayTrack: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  reset: jest.fn(() => Promise.resolve()),
  isPlaying: false,
  ...overrides,
});

describe("AudioTrackDialog", () => {
  const { Linking } = require("react-native");
  beforeEach(() => {
    jest.clearAllMocks();
    TrackPlayer.getActiveTrack.mockResolvedValue(null);
    TrackPlayer.getPlaybackState.mockResolvedValue({ state: "paused" });
    mockState = { fontFace: "TestFont" };
    jest.spyOn(Linking, "openURL").mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    Linking.openURL.mockRestore();
  });

  it("renders header and tracks list when tracks are available", () => {
    const props = createProps();
    const { getByText, getByTestId } = render(<AudioTrackDialog {...props} />);

    expect(getByText("Welcome to Sundar Gutka")).toBeTruthy();
    expect(getByTestId("tracks-list")).toBeTruthy();
  });

  it("plays a track when selected in header mode", async () => {
    const props = createProps();
    const { getByTestId } = render(<AudioTrackDialog {...props} />);

    fireEvent.press(getByTestId("track-track-1"));

    await waitFor(() => {
      expect(props.addAndPlayTrack).toHaveBeenCalledWith(
        defaultTracks[0].id,
        defaultTracks[0].audioUrl,
        "Gutka",
        defaultTracks[0].displayName,
        defaultTracks[0].lyricsUrl,
        defaultTracks[0].trackLengthSec,
        defaultTracks[0].trackSizeMB,
        true,
        defaultTracks[0].remoteUrl || defaultTracks[0].audioUrl
      );
    });
  });

  it("shows row loading signal while preview is starting", async () => {
    let resolvePreview;
    const previewPromise = new Promise((resolve) => {
      resolvePreview = resolve;
    });
    const props = createProps({
      addAndPlayTrack: jest.fn(() => previewPromise),
    });
    const { getByTestId } = render(<AudioTrackDialog {...props} />);

    fireEvent.press(getByTestId("track-track-1"));

    await waitFor(() => {
      expect(getByTestId("preview-loading-id").props.children).toBe("track-1");
    });

    await act(async () => {
      resolvePreview();
    });
  });

  it("keeps a bare Next label (no countdown text) while preview is playing", async () => {
    // The button intentionally always reads a bare "Next" — the countdown is
    // conveyed visually by the progress-fill bar, not by button text (see
    // nextButtonLabel in index.jsx).
    TrackPlayer.getActiveTrack.mockResolvedValue({ id: defaultTracks[0].id });
    TrackPlayer.getPlaybackState.mockResolvedValue({ state: "playing" });

    const props = createProps({ isPlaying: true });
    const { getByTestId, getByText } = render(<AudioTrackDialog {...props} />);

    fireEvent.press(getByTestId("track-track-1"));

    await waitFor(() => {
      expect(getByText("Next")).toBeTruthy();
    });
  });

  it("stops playback when selecting the currently playing track again", async () => {
    const props = createProps({ isPlaying: true });
    const { getByTestId } = render(<AudioTrackDialog {...props} />);

    fireEvent.press(getByTestId("track-track-1"));

    await waitFor(() => {
      expect(props.addAndPlayTrack).toHaveBeenCalledTimes(1);
    });

    fireEvent.press(getByTestId("track-track-1"));

    await waitFor(() => {
      expect(props.stop).toHaveBeenCalled();
      expect(props.reset).toHaveBeenCalled();
      expect(props.addAndPlayTrack).toHaveBeenCalledTimes(1);
    });
  });

  it("immediately selects track when header is hidden", async () => {
    const props = createProps({ isHeader: false });
    const { getByTestId } = render(<AudioTrackDialog {...props} />);

    fireEvent.press(getByTestId("track-track-2"));

    await waitFor(() => {
      expect(props.handleTrackSelect).toHaveBeenCalledWith(defaultTracks[1]);
      expect(props.addAndPlayTrack).not.toHaveBeenCalled();
    });
  });

  it("enables play button when a track is selected and triggers handleTrackSelect on Next", async () => {
    const props = createProps();
    const { getByTestId } = render(<AudioTrackDialog {...props} />);

    fireEvent.press(getByTestId("track-track-2"));

    const playButton = getByTestId("play-button");
    await act(async () => {
      fireEvent.press(playButton);
    });

    await waitFor(() => {
      expect(props.handleTrackSelect).toHaveBeenCalledWith(defaultTracks[1]);
    });
  });

  it("shows loading state on Next while opening full player", async () => {
    let resolveNext;
    const nextPromise = new Promise((resolve) => {
      resolveNext = resolve;
    });
    const props = createProps({
      handleTrackSelect: jest.fn(() => nextPromise),
    });
    const { getByTestId, getByText } = render(<AudioTrackDialog {...props} />);

    fireEvent.press(getByTestId("track-track-2"));
    fireEvent.press(getByTestId("play-button"));

    await waitFor(() => {
      expect(getByText("Opening Player...")).toBeTruthy();
    });

    await act(async () => {
      resolveNext();
    });
  });

  it("resets selection and calls onCloseTrackModal when close button pressed", () => {
    const props = createProps();
    const { getByTestId } = render(<AudioTrackDialog {...props} />);

    const closeButton = getByTestId("close-button");
    fireEvent.press(closeButton);

    expect(props.onCloseTrackModal).toHaveBeenCalledTimes(1);
  });

  it("plays another track when a new track is selected while preview is playing", async () => {
    TrackPlayer.getActiveTrack.mockResolvedValue({ id: defaultTracks[0].id });
    TrackPlayer.getPlaybackState.mockResolvedValue({ state: "playing" });

    const props = createProps({ isPlaying: true });
    const { getByTestId } = render(<AudioTrackDialog {...props} />);

    fireEvent.press(getByTestId("track-track-1"));

    await waitFor(() => {
      expect(props.addAndPlayTrack).toHaveBeenCalledWith(
        defaultTracks[0].id,
        defaultTracks[0].audioUrl,
        "Gutka",
        defaultTracks[0].displayName,
        defaultTracks[0].lyricsUrl,
        defaultTracks[0].trackLengthSec,
        defaultTracks[0].trackSizeMB,
        true,
        defaultTracks[0].remoteUrl || defaultTracks[0].audioUrl
      );
    });

    TrackPlayer.getActiveTrack.mockResolvedValue({ id: defaultTracks[1].id });
    fireEvent.press(getByTestId("track-track-2"));

    await waitFor(() => {
      expect(props.stop).toHaveBeenCalled();
      expect(props.reset).toHaveBeenCalled();
      expect(props.addAndPlayTrack).toHaveBeenCalledWith(
        defaultTracks[1].id,
        defaultTracks[1].audioUrl,
        "Gutka",
        defaultTracks[1].displayName,
        defaultTracks[1].lyricsUrl,
        defaultTracks[1].trackLengthSec,
        defaultTracks[1].trackSizeMB,
        true,
        defaultTracks[1].remoteUrl || defaultTracks[1].audioUrl
      );
    });
  });
});
