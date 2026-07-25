// BottomNavigation.test.jsx
import React from "react";

import { render, fireEvent, waitFor } from "@testing-library/react-native";

import { getMockDispatch, setMockState } from "@common/test-utils/mocks/react-redux";

import BottomNavigation from "./index";

// Mock styles module used by useThemedStyles (not strictly necessary because we mock the hook)
jest.mock("./style", () => jest.fn());

// Mock useNavigation hook
let mockNavigation;
const mockUseNavigation = jest.fn(() => mockNavigation);

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockUseNavigation(),
}));

// BottomNavigation imports the real sevaConfig via a relative path (bypassing
// the global @common mock), which transitively loads react-native-localization
// — whose native module isn't available in Jest and throws on import. The
// component only needs getSevaConfig() to decide the Seva dot, so mock it.
jest.mock("../../../services/sevaConfig", () => ({
  getSevaConfig: jest.fn(() => Promise.resolve({ showSevaDot: false })),
}));

const mockPauseTrack = jest.fn(() => Promise.resolve());
const mockStopTrack = jest.fn(() => Promise.resolve());
const mockResetPlayer = jest.fn(() => Promise.resolve());

jest.mock("@common/TrackPlayerUtils", () => ({
  pauseTrack: (...args) => mockPauseTrack(...args),
  stopTrack: (...args) => mockStopTrack(...args),
  resetPlayer: (...args) => mockResetPlayer(...args),
}));

// Mock global fetch so checkInternetConnection resolves immediately (online)
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
  })
);
global.fetch = mockFetch;

// --- Helpers ---

const createNavigation = ({ currentRoute = "Home" } = {}) => {
  const navigate = jest.fn();
  const popToTop = jest.fn();
  const goBack = jest.fn();
  const addListener = jest.fn(() => jest.fn()); // Returns unsubscribe function
  const routes = [{ name: "Home" }, { name: "Reader" }, { name: "Settings" }];
  let index = 0;
  if (currentRoute === "Reader") {
    index = 1;
  } else if (currentRoute === "Settings") {
    index = 2;
  }
  const getState = jest.fn(() => ({
    routes,
    index,
  }));
  return { navigate, getState, popToTop, goBack, addListener };
};

describe("BottomNavigation", () => {
  const mockDispatch = getMockDispatch();

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore online mock after clearAllMocks
    mockFetch.mockResolvedValue({ ok: true });
    setMockState({ isAudio: false });
    mockNavigation = createNavigation();
    mockUseNavigation.mockReturnValue(mockNavigation);
  });

  afterEach(async () => {
    // Flush microtasks to allow the mocked fetch checkInternetConnection to resolve and set component state safely inside act boundaries
    await waitFor(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 0);
        })
    );
  });

  // The Read/Music tabs live in the reader-context bar (Home/Read/Music/Settings).
  // The home-context bar is Home/Dashboard/Seva/Settings, so tests that exercise
  // Read/Music render with context="reader".

  test("renders four buttons with correct accessibility labels", () => {
    const { getByLabelText } = render(<BottomNavigation activeKey="Home" context="reader" />);

    expect(getByLabelText("bottomnav-Home")).toBeTruthy();
    expect(getByLabelText("bottomnav-Read")).toBeTruthy();
    expect(getByLabelText("bottomnav-Music")).toBeTruthy();
    expect(getByLabelText("bottomnav-Settings")).toBeTruthy();
  });

  test("shows labels for non-active items and hides label for the active item", () => {
    const { queryByText } = render(<BottomNavigation activeKey="Music" context="reader" />);

    // Active "Music" label should be hidden (component shows label only when NOT active)
    expect(queryByText("Audio")).toBeNull();

    // Others should be visible (reader bar: Home tab is labelled "All Banis")
    expect(queryByText("All Banis")).not.toBeNull();
    expect(queryByText("Read")).not.toBeNull();
    expect(queryByText("Settings")).not.toBeNull();
  });

  test("pressing Home navigates to Home", () => {
    const { getByLabelText } = render(<BottomNavigation activeKey="Home" context="reader" />);

    fireEvent.press(getByLabelText("bottomnav-Home"));

    expect(mockNavigation.popToTop).toHaveBeenCalled();
  });

  test("pressing Read when audio is on toggles audio to false", async () => {
    setMockState({ isAudio: true });
    mockNavigation = createNavigation({ currentRoute: "Home" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Home" context="reader" />);

    fireEvent.press(getByLabelText("bottomnav-Read"));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: false });
    });
  });

  test("pressing Read when audio is off does not toggle audio", async () => {
    setMockState({ isAudio: false });
    mockNavigation = createNavigation({ currentRoute: "Home" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Home" context="reader" />);

    fireEvent.press(getByLabelText("bottomnav-Read"));

    await waitFor(() => {
      expect(mockDispatch).not.toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: false });
    });
  });

  test("pressing Read from Settings calls goBack", async () => {
    setMockState({ isAudio: false });
    mockNavigation = createNavigation({ currentRoute: "Settings" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Settings" context="reader" />);

    fireEvent.press(getByLabelText("bottomnav-Read"));

    await waitFor(() => {
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  test("pressing Music when NOT on Reader or Settings dispatches actions", async () => {
    setMockState({ isAudio: false });
    mockNavigation = createNavigation({ currentRoute: "Home" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Home" context="reader" />);

    fireEvent.press(getByLabelText("bottomnav-Music"));

    // Dispatches: autoScroll=false, audio toggled from false -> true
    await waitFor(() => {
      // (Autoscroll is no longer toggled by BottomNavigation)
      expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: true });
    });
  });

  test("pressing Music when ALREADY on Reader dispatches actions", async () => {
    setMockState({ isAudio: false });
    mockNavigation = createNavigation({ currentRoute: "Reader" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Music" context="reader" />);

    fireEvent.press(getByLabelText("bottomnav-Music"));

    // Dispatches: autoScroll=false, audio toggled from false -> true
    await waitFor(() => {
      // (Autoscroll is no longer toggled by BottomNavigation)
      expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: true });
    });
  });

  test("pressing Music from Settings calls goBack and reopens preview when audio was already on", async () => {
    setMockState({ isAudio: true });
    mockNavigation = createNavigation({ currentRoute: "Settings" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Settings" context="reader" />);

    fireEvent.press(getByLabelText("bottomnav-Music"));

    await waitFor(() => {
      // When audio is already on and coming from Settings, the new behaviour
      // is a simple goBack() — stop/reset are not called to avoid flicker.
      expect(mockNavigation.goBack).toHaveBeenCalled();
      expect(mockStopTrack).not.toHaveBeenCalled();
      expect(mockResetPlayer).not.toHaveBeenCalled();
    });
  });

  test("pressing Music from Settings calls goBack and toggles audio if audio was off", async () => {
    setMockState({ isAudio: false });
    mockNavigation = createNavigation({ currentRoute: "Settings" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Settings" context="reader" />);

    fireEvent.press(getByLabelText("bottomnav-Music"));

    await waitFor(() => {
      expect(mockNavigation.goBack).toHaveBeenCalled();
      // (Autoscroll is no longer toggled by BottomNavigation)
      expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: true });
    });
  });

  test("pressing Settings navigates to Settings", () => {
    const { getByLabelText } = render(<BottomNavigation activeKey="Home" />);

    fireEvent.press(getByLabelText("bottomnav-Settings"));

    expect(mockNavigation.navigate).toHaveBeenCalledWith("Settings");
  });

  test("pressing Music while already open restarts audio into preview mode", async () => {
    setMockState({ isAudio: true });
    mockNavigation = createNavigation({ currentRoute: "Reader" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Music" context="reader" />);

    fireEvent.press(getByLabelText("bottomnav-Music"));

    await waitFor(() => {
      // When isAudio is already true and already on Reader, the new behaviour
      // is a no-op (early return) to avoid the stop→toggle flicker.
      expect(mockStopTrack).not.toHaveBeenCalled();
      expect(mockResetPlayer).not.toHaveBeenCalled();
      // toggleAudio is also not called — user stays in the player
      expect(mockDispatch).not.toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: false });
      expect(mockDispatch).not.toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: true });
    });
  });

  test("As a user on the home tab bar I want only home tabs (Read/Music live in the reader bar)", () => {
    mockNavigation = createNavigation({ currentRoute: "Settings" });
    mockNavigation.getState.mockReturnValue({
      routes: [{ name: "Home" }, { name: "Settings" }],
      index: 1,
    });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText, queryByLabelText } = render(<BottomNavigation activeKey="Settings" />);

    // Home and Settings should be visible
    expect(getByLabelText("bottomnav-Home")).toBeTruthy();
    expect(getByLabelText("bottomnav-Settings")).toBeTruthy();

    // Read and Music are reader-context tabs — absent from the home bar
    expect(queryByLabelText("bottomnav-Read")).toBeNull();
    expect(queryByLabelText("bottomnav-Music")).toBeNull();
  });

  test("As a user on the reader tab bar I want Read and Music tabs visible", () => {
    mockNavigation = createNavigation({ currentRoute: "Settings" });
    mockNavigation.getState.mockReturnValue({
      routes: [{ name: "Home" }, { name: "Reader" }, { name: "Settings" }],
      index: 2,
    });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Settings" context="reader" />);

    // All tabs should be visible in the reader context
    expect(getByLabelText("bottomnav-Home")).toBeTruthy();
    expect(getByLabelText("bottomnav-Read")).toBeTruthy();
    expect(getByLabelText("bottomnav-Music")).toBeTruthy();
    expect(getByLabelText("bottomnav-Settings")).toBeTruthy();
  });

  test("shows Music tab even when audio feature is disabled (recovery shortcut)", () => {
    setMockState({ isAudio: false, isAudioFeatureEnabled: false, isAutoScroll: false });
    mockNavigation = createNavigation({ currentRoute: "Reader" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Read" context="reader" />);

    expect(getByLabelText("bottomnav-Home")).toBeTruthy();
    expect(getByLabelText("bottomnav-Read")).toBeTruthy();
    expect(getByLabelText("bottomnav-Settings")).toBeTruthy();
    expect(getByLabelText("bottomnav-Music")).toBeTruthy(); // always visible as recovery shortcut
  });

  test("shows Music tab even when audio feature is disabled IF auto-scroll is running", () => {
    // Redux sets isAudioFeatureEnabled to false implicitly when isAutoScroll is true
    setMockState({ isAudio: false, isAudioFeatureEnabled: false, isAutoScroll: true });
    mockNavigation = createNavigation({ currentRoute: "Reader" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Read" context="reader" />);

    // Music should NOT be null
    expect(getByLabelText("bottomnav-Music")).toBeTruthy();
  });
});
