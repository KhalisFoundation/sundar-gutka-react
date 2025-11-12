// BottomNavigation.test.jsx
import React from "react";

import { render, fireEvent } from "@testing-library/react-native";

import { getMockDispatch, setMockState } from "@common/test-utils/mocks/react-redux";

import BottomNavigation from "./index";

// Mock styles module used by useThemedStyles (not strictly necessary because we mock the hook)
jest.mock("./style", () => jest.fn());

// --- Helpers ---

const createNavigation = ({ currentRoute = "Home" } = {}) => {
  const navigate = jest.fn();
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
  return { navigate, getState };
};

describe("BottomNavigation", () => {
  const mockDispatch = getMockDispatch();

  beforeEach(() => {
    jest.clearAllMocks();
    setMockState({ isAudio: false, currentBani: { id: 123 } });
  });

  test("renders four buttons with correct accessibility labels", () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(
      <BottomNavigation navigation={navigation} activeKey="Home" />
    );

    expect(getByLabelText("bottomnav-Home")).toBeTruthy();
    expect(getByLabelText("bottomnav-Read")).toBeTruthy();
    expect(getByLabelText("bottomnav-Music")).toBeTruthy();
    expect(getByLabelText("bottomnav-Settings")).toBeTruthy();
  });

  test("shows labels for non-active items and hides label for the active item", () => {
    const navigation = createNavigation();
    const { queryByText } = render(<BottomNavigation navigation={navigation} activeKey="Music" />);

    // Active "Music" label should be hidden (component shows label only when NOT active)
    expect(queryByText("Music")).toBeNull();

    // Others should be visible
    expect(queryByText("Home")).not.toBeNull();
    expect(queryByText("Read")).not.toBeNull();
    expect(queryByText("Settings")).not.toBeNull();
  });

  test("pressing Home navigates to Home", () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(
      <BottomNavigation navigation={navigation} activeKey="Home" />
    );

    fireEvent.press(getByLabelText("bottomnav-Home"));

    expect(navigation.navigate).toHaveBeenCalledWith("Home");
  });

  test("pressing Read navigates to Reader with currentBani if present and toggles audio to false", () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(
      <BottomNavigation navigation={navigation} activeKey="Home" />
    );

    fireEvent.press(getByLabelText("bottomnav-Read"));
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: false });

    expect(navigation.navigate).toHaveBeenCalledWith("Reader", {
      key: "Reader-123",
      params: { id: 123 },
    });
  });

  test("pressing Read uses defaultBani when currentBani is null", () => {
    setMockState({ isAudio: false, currentBani: null }); // override for this test
    const navigation = createNavigation();
    const { getByLabelText } = render(
      <BottomNavigation navigation={navigation} activeKey="Home" />
    );

    fireEvent.press(getByLabelText("bottomnav-Read"));

    expect(navigation.navigate).toHaveBeenCalledWith("Reader", {
      key: "Reader-default",
      params: { id: "default" },
    });
  });

  test("pressing Music when NOT on Reader navigates to Reader and dispatches actions", () => {
    const navigation = createNavigation({ currentRoute: "Home" }); // not on Reader
    const { getByLabelText } = render(
      <BottomNavigation navigation={navigation} activeKey="Home" />
    );

    fireEvent.press(getByLabelText("bottomnav-Music"));

    // Navigates to Reader first
    expect(navigation.navigate).toHaveBeenCalledWith("Reader", {
      key: "Reader-123",
      params: { id: 123 },
    });

    // Dispatches: autoScroll=false, audio toggled from false -> true
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUTO_SCROLL", payload: false });
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: true });
  });

  test("pressing Music when ALREADY on Reader does not navigate but still dispatches actions", () => {
    const navigation = createNavigation({ currentRoute: "Reader" }); // already on Reader
    const { getByLabelText } = render(
      <BottomNavigation navigation={navigation} activeKey="Music" />
    );

    fireEvent.press(getByLabelText("bottomnav-Music"));

    // No navigation when already on Reader
    expect(navigation.navigate).not.toHaveBeenCalled();

    // Still dispatches: autoScroll=false, audio toggled from false -> true
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUTO_SCROLL", payload: false });
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: true });
  });

  test("pressing Settings navigates to Settings", () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(
      <BottomNavigation navigation={navigation} activeKey="Home" />
    );

    fireEvent.press(getByLabelText("bottomnav-Settings"));

    expect(navigation.navigate).toHaveBeenCalledWith("Settings");
  });

  test("pressing Music toggles audio based on current isAudio state", () => {
    // Start with isAudio=true to verify toggle -> false
    setMockState({ isAudio: true, currentBani: { id: 999 } });
    const navigation = createNavigation({ currentRoute: "Reader" });
    const { getByLabelText } = render(
      <BottomNavigation navigation={navigation} activeKey="Music" />
    );

    fireEvent.press(getByLabelText("bottomnav-Music"));

    // toggleAutoScroll(false) always
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUTO_SCROLL", payload: false });
    // toggled from true -> false
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_AUDIO", payload: false });
  });

  test("As a user entering Settings from Home I want irrelevant tabs hidden So that navigation isn't confusing", () => {
    const navigation = createNavigation({ currentRoute: "Settings" });
    const { getByLabelText, queryByLabelText } = render(
      <BottomNavigation navigation={navigation} activeKey="Settings" />
    );

    // Home and Settings should be visible
    expect(getByLabelText("bottomnav-Home")).toBeTruthy();
    expect(getByLabelText("bottomnav-Settings")).toBeTruthy();

    // Read and Music should be hidden on Settings page
    expect(queryByLabelText("bottomnav-Read")).toBeNull();
    expect(queryByLabelText("bottomnav-Music")).toBeNull();
  });
});
