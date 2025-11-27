/* eslint-env jest */
/* eslint-disable react/jsx-props-no-spreading */

import React from "react";

import { render, fireEvent, waitFor } from "@testing-library/react-native";

import AudioTrackDialog from "./index";

// -------------------- MOCKS --------------------

let mockState = { fontFace: "TestFont" };

jest.mock("react-redux", () => ({
  useSelector: (selector) => selector(mockState),
}));

jest.mock("@common/context", () => ({
  __esModule: true,
  default: () => ({
    theme: {
      mode: "light",
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
    },
    CustomText: ({ children, ...props }) => (
      <Text accessibilityRole="text" {...props}>
        {children}
      </Text>
    ),
  };
});

jest.mock("@react-native-community/blur", () => {
  const { View } = require("react-native");
  return {
    BlurView: (props) => <View testID="blur-view" {...props} />,
  };
});

jest.mock("../ScrollViewComponent", () => {
  const { View, Pressable, Text } = require("react-native");
  return ({ tracks, handleSelectTrack }) => (
    <View testID="tracks-list">
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
});

// -------------------- HELPERS --------------------

const defaultTracks = [
  {
    id: "track-1",
    displayName: "Track One",
    audioUrl: "https://example.com/track-1.mp3",
    lyricsUrl: "https://example.com/track-1.json",
    trackLengthSec: 100,
    trackSizeMB: 2.5,
  },
  {
    id: "track-2",
    displayName: "Track Two",
    audioUrl: "https://example.com/track-2.mp3",
    lyricsUrl: "https://example.com/track-2.json",
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
  isPlaying: false,
  ...overrides,
});

describe("AudioTrackDialog", () => {
  const { Linking } = require("react-native");
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("shows loading state instead of list when isLoading is true", () => {
    const props = createProps({ isLoading: true });
    const { queryByTestId } = render(<AudioTrackDialog {...props} />);

    expect(queryByTestId("tracks-list")).toBeNull();
  });

  it("plays a track when selected in header mode", async () => {
    const props = createProps();
    const { getByTestId } = render(<AudioTrackDialog {...props} />);

    fireEvent.press(getByTestId("track-track-1"));

    await waitFor(() => {
      expect(props.addAndPlayTrack).toHaveBeenCalledWith(
        defaultTracks[0].id,
        defaultTracks[0].audioUrl,
        defaultTracks[0].displayName,
        defaultTracks[0].displayName,
        defaultTracks[0].lyricsUrl,
        defaultTracks[0].trackLengthSec,
        defaultTracks[0].trackSizeMB,
        true
      );
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
      expect(props.stop).toHaveBeenCalledTimes(1);
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

  it("renders empty state and opens request link when no tracks exist", async () => {
    const props = createProps({ tracks: [] });
    const { getByText } = render(<AudioTrackDialog {...props} />);

    expect(getByText("Maafi Ji")).toBeTruthy();

    fireEvent.press(getByText("Request audio for this paath"));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith("https://khalisfoundation.org");
    });
  });

  it("enables play button when a track is selected and triggers handleTrackSelect on Next", async () => {
    const props = createProps();
    const { getByTestId } = render(<AudioTrackDialog {...props} />);

    fireEvent.press(getByTestId("track-track-2"));

    const playButton = getByTestId("play-button");
    fireEvent.press(playButton);

    await waitFor(() => {
      expect(props.handleTrackSelect).toHaveBeenCalledWith(defaultTracks[1]);
    });
  });

  it("resets selection and calls onCloseTrackModal when close button pressed", () => {
    const props = createProps();
    const { getByTestId } = render(<AudioTrackDialog {...props} />);

    const closeButton = getByTestId("close-button");
    fireEvent.press(closeButton);

    expect(props.onCloseTrackModal).toHaveBeenCalledTimes(1);
  });
});
