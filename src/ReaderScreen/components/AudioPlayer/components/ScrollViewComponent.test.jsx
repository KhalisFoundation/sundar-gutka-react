/* eslint-env jest */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import ScrollViewComponent, { isOfflineAvailable } from "./ScrollViewComponent";

// Mock redux
let mockState;
jest.mock("react-redux", () => ({
  useSelector: (selectorFn) => selectorFn(mockState),
}));

// Mock theme + styles
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
        audioPlayer: "#654321",
        audioTitleText: "#000000",
        trackBackgroundColor: "#F5F5F5",
      },
      staticColors: {
        WHITE_COLOR: "#FFFFFF",
        NIGHT_BLACK: "#111111",
      },
    },
  }),
}));

jest.mock("@common/hooks/useThemedStyles", () => {
  const styles = {
    trackList: {},
    trackListContent: {},
    trackSectionHeader: {},
    trackItem: {},
    selectedTrackItem: {},
    trackItemRight: {},
    trackName: {},
    selectedTrackName: {},
    trackItemDisabled: {},
  };
  return () => () => styles;
});

jest.mock("@rneui/themed", () => {
  const { Text } = require("react-native");
  return { Icon: (props) => <Text testID="offline-pin-icon" {...props} /> };
});

jest.mock("@common/icons", () => {
  const { Text } = require("react-native");
  return {
    PlayIcon: (props) => <Text testID="play-icon" {...props} />,
    StopIcon: (props) => <Text testID="stop-icon" {...props} />,
  };
});

jest.mock("@common", () => {
  const { Text } = require("react-native");
  return {
    STRINGS: {
      DOWNLOADED: "Downloaded",
      NOT_DOWNLOADED: "Not Downloaded",
    },
    CustomText: (props) => <Text {...props} />,
  };
});

const track = (id, displayName, extra = {}) => ({
  id,
  displayName,
  audioUrl: `https://example.com/${id}.m4a`,
  remoteUrl: `https://example.com/${id}.m4a`,
  ...extra,
});

describe("ScrollViewComponent", () => {
  beforeEach(() => {
    mockState = { downloadRegistry: {} };
  });

  it("groups downloaded tracks above non-downloaded tracks", () => {
    mockState.downloadRegistry = { "ArtistZ/z.m4a": true };
    const tracks = [
      track("z", "Artist Z", { audioUrl: "https://example.com/ArtistZ/z.m4a", remoteUrl: "https://example.com/ArtistZ/z.m4a" }),
      track("a", "Artist A"),
    ];

    const { getByText, getAllByText } = render(
      <ScrollViewComponent tracks={tracks} handleSelectTrack={jest.fn()} />
    );

    expect(getByText("Downloaded")).toBeTruthy();
    expect(getByText("Not Downloaded")).toBeTruthy();

    const names = getAllByText(/Artist [AZ]/).map((el) => el.props.children);
    expect(names).toEqual(["Artist Z", "Artist A"]);
  });

  it("sorts each group alphabetically by display name", () => {
    const tracks = [track("c", "Charlie"), track("a", "Alice"), track("b", "Bob")];

    const { getAllByText } = render(
      <ScrollViewComponent tracks={tracks} handleSelectTrack={jest.fn()} />
    );

    const names = getAllByText(/^(Alice|Bob|Charlie)$/).map((el) => el.props.children);
    expect(names).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("omits a group's header entirely when that group is empty", () => {
    const tracks = [track("a", "Alice")];

    const { queryByText } = render(
      <ScrollViewComponent tracks={tracks} handleSelectTrack={jest.fn()} />
    );

    expect(queryByText("Downloaded")).toBeNull();
    expect(queryByText("Not Downloaded")).toBeTruthy();
  });

  it("disables and never calls handleSelectTrack for a non-downloaded track while offline", () => {
    const handleSelectTrack = jest.fn();
    const tracks = [track("a", "Alice")];

    const { getByText } = render(
      <ScrollViewComponent tracks={tracks} handleSelectTrack={handleSelectTrack} isOffline />
    );

    fireEvent.press(getByText("Alice"));
    expect(handleSelectTrack).not.toHaveBeenCalled();
  });

  it("still allows tapping a downloaded track while offline", () => {
    mockState.downloadRegistry = { "ArtistA/a.m4a": true };
    const handleSelectTrack = jest.fn();
    const tracks = [
      track("a", "Alice", {
        audioUrl: "https://example.com/ArtistA/a.m4a",
        remoteUrl: "https://example.com/ArtistA/a.m4a",
      }),
    ];

    const { getByText } = render(
      <ScrollViewComponent tracks={tracks} handleSelectTrack={handleSelectTrack} isOffline />
    );

    fireEvent.press(getByText("Alice"));
    expect(handleSelectTrack).toHaveBeenCalledWith(tracks[0]);
  });
});

describe("isOfflineAvailable", () => {
  it("is true when the download registry has an entry for the track's path", () => {
    const t = track("a", "Alice", {
      audioUrl: "https://example.com/ArtistA/a.m4a",
      remoteUrl: "https://example.com/ArtistA/a.m4a",
    });
    expect(isOfflineAvailable(t, { "ArtistA/a.m4a": true })).toBe(true);
  });

  it("is false for a remote track with no registry entry", () => {
    const t = track("a", "Alice");
    expect(isOfflineAvailable(t, {})).toBe(false);
  });

  it("is true when the track is already a local (non-http) audioUrl", () => {
    const t = { id: "a", displayName: "Alice", audioUrl: "/local/path/a.m4a" };
    expect(isOfflineAvailable(t, {})).toBe(true);
  });
});
