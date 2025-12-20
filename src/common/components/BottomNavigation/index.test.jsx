// BottomNavigation.test.jsx
import React from "react";

import { render, fireEvent } from "@testing-library/react-native";

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
    setMockState({ isAudio: false });
    mockNavigation = createNavigation();
    mockUseNavigation.mockReturnValue(mockNavigation);
  });

  test("renders four buttons with correct accessibility labels", () => {
    const { getByLabelText } = render(<BottomNavigation activeKey="Home" />);

    expect(getByLabelText("bottomnav-Home")).toBeTruthy();
    expect(getByLabelText("bottomnav-Read")).toBeTruthy();
    expect(getByLabelText("bottomnav-Music")).toBeTruthy();
    expect(getByLabelText("bottomnav-Settings")).toBeTruthy();
  });

  test("shows labels for non-active items and hides label for the active item", () => {
    const { queryByText } = render(<BottomNavigation activeKey="Music" />);

    // Active "Music" label should be hidden (component shows label only when NOT active)
    expect(queryByText("Music")).toBeNull();

    // Others should be visible
    expect(queryByText("Home")).not.toBeNull();
    expect(queryByText("Read")).not.toBeNull();
    expect(queryByText("Settings")).not.toBeNull();
  });

  test("pressing Home navigates to Home", () => {
    const { getByLabelText } = render(<BottomNavigation activeKey="Home" />);

    fireEvent.press(getByLabelText("bottomnav-Home"));

    expect(mockNavigation.popToTop).toHaveBeenCalled();
  });

  test("pressing Read when audio is on toggles audio to false", () => {
    setMockState({ isAudio: true });
    mockNavigation = createNavigation({ currentRoute: "Home" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Home" />);

    fireEvent.press(getByLabelText("bottomnav-Read"));

    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: false });
  });

  test("pressing Read when audio is off does not toggle audio", () => {
    setMockState({ isAudio: false });
    mockNavigation = createNavigation({ currentRoute: "Home" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Home" />);

    fireEvent.press(getByLabelText("bottomnav-Read"));

    expect(mockDispatch).not.toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: false });
  });

  test("pressing Read from Settings calls goBack", () => {
    setMockState({ isAudio: false });
    mockNavigation = createNavigation({ currentRoute: "Settings" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Settings" />);

    fireEvent.press(getByLabelText("bottomnav-Read"));

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  test("pressing Music when NOT on Reader or Settings dispatches actions", () => {
    setMockState({ isAudio: false });
    mockNavigation = createNavigation({ currentRoute: "Home" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Home" />);

    fireEvent.press(getByLabelText("bottomnav-Music"));

    // Dispatches: autoScroll=false, audio toggled from false -> true
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUTO_SCROLL", payload: false });
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: true });
  });

  test("pressing Music when ALREADY on Reader dispatches actions", () => {
    setMockState({ isAudio: false });
    mockNavigation = createNavigation({ currentRoute: "Reader" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Music" />);

    fireEvent.press(getByLabelText("bottomnav-Music"));

    // Dispatches: autoScroll=false, audio toggled from false -> true
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUTO_SCROLL", payload: false });
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: true });
  });

  test("pressing Music from Settings calls goBack and keeps audio ON if audio was already on", () => {
    setMockState({ isAudio: true });
    mockNavigation = createNavigation({ currentRoute: "Settings" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Settings" />);

    fireEvent.press(getByLabelText("bottomnav-Music"));

    expect(mockNavigation.goBack).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUTO_SCROLL", payload: false });
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: true });
  });

  test("pressing Music from Settings calls goBack and toggles audio if audio was off", () => {
    setMockState({ isAudio: false });
    mockNavigation = createNavigation({ currentRoute: "Settings" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Settings" />);

    fireEvent.press(getByLabelText("bottomnav-Music"));

    expect(mockNavigation.goBack).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUTO_SCROLL", payload: false });
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: true });
  });

  test("pressing Settings navigates to Settings", () => {
    const { getByLabelText } = render(<BottomNavigation activeKey="Home" />);

    fireEvent.press(getByLabelText("bottomnav-Settings"));

    expect(mockNavigation.navigate).toHaveBeenCalledWith("Settings");
  });

  test("pressing Music toggles audio based on current isAudio state", () => {
    // Start with isAudio=true to verify toggle -> false
    setMockState({ isAudio: true });
    mockNavigation = createNavigation({ currentRoute: "Reader" });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Music" />);

    fireEvent.press(getByLabelText("bottomnav-Music"));

    // toggleAutoScroll(false) always
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUTO_SCROLL", payload: false });
    // toggled from true -> false
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: false });
  });

  test("As a user entering Settings from Home I want irrelevant tabs hidden So that navigation isn't confusing", () => {
    // Simulate coming from Home (not Reader)
    mockNavigation = createNavigation({ currentRoute: "Settings" });
    // Set up navigation state to have Home as previous route
    mockNavigation.getState.mockReturnValue({
      routes: [{ name: "Home" }, { name: "Settings" }],
      index: 1,
    });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText, queryByLabelText } = render(<BottomNavigation activeKey="Settings" />);

    // Home and Settings should be visible
    expect(getByLabelText("bottomnav-Home")).toBeTruthy();
    expect(getByLabelText("bottomnav-Settings")).toBeTruthy();

    // Read and Music should be hidden on Settings page when coming from Home
    expect(queryByLabelText("bottomnav-Read")).toBeNull();
    expect(queryByLabelText("bottomnav-Music")).toBeNull();
  });

  test("As a user entering Settings from Reader I want Read and Music tabs to stay visible", () => {
    // Simulate coming from Reader
    mockNavigation = createNavigation({ currentRoute: "Settings" });
    // Set up navigation state to have Reader as previous route
    mockNavigation.getState.mockReturnValue({
      routes: [{ name: "Home" }, { name: "Reader" }, { name: "Settings" }],
      index: 2,
    });
    mockUseNavigation.mockReturnValue(mockNavigation);

    const { getByLabelText } = render(<BottomNavigation activeKey="Settings" />);

    // All tabs should be visible when coming from Reader
    expect(getByLabelText("bottomnav-Home")).toBeTruthy();
    expect(getByLabelText("bottomnav-Read")).toBeTruthy();
    expect(getByLabelText("bottomnav-Music")).toBeTruthy();
    expect(getByLabelText("bottomnav-Settings")).toBeTruthy();
  });
});
