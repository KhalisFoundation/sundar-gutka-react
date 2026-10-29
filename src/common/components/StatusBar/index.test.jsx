/* eslint-env jest */
import React from "react";
import { NativeModules, Platform } from "react-native";

import { act, render } from "@testing-library/react-native";

import StatusBarComponent from "./index";

let mockStatusBar = false;
jest.mock("react-redux", () => ({ useSelector: (fn) => fn({ isStatusBar: mockStatusBar }) }));
jest.mock("@common/context", () => () => ({
  theme: { chrome: { statusBarStyle: "dark-content" } },
}));
// React Native's own StatusBar is not what is under test, and rendered for
// Android it leaves native-call work queued behind the suite.
jest.mock("react-native/Libraries/Components/StatusBar/StatusBar", () => () => null);

// Showing the status bar takes an Android 11+ window out of edge-to-edge, so a
// screen with a StatusBar padded itself above both system bars until the next
// focus change.
describe("on Android", () => {
  let unmount;
  beforeEach(() => {
    jest.useFakeTimers();
    jest.replaceProperty(Platform, "OS", "android");
    NativeModules.SystemBars = { restoreEdgeToEdge: jest.fn() };
    mockStatusBar = false;
  });
  afterEach(() => {
    unmount?.();
    unmount = undefined;
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete NativeModules.SystemBars;
  });

  it("puts the window back edge-to-edge once the bar has been applied", () => {
    ({ unmount } = render(<StatusBarComponent backgroundColor="#fff" />));
    expect(NativeModules.SystemBars.restoreEdgeToEdge).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(NativeModules.SystemBars.restoreEdgeToEdge).toHaveBeenCalledTimes(1);
  });

  it("does it again when the setting changes", () => {
    const rendered = render(<StatusBarComponent backgroundColor="#fff" />);
    ({ unmount } = rendered);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    mockStatusBar = true;
    rendered.rerender(<StatusBarComponent backgroundColor="#fff" />);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(NativeModules.SystemBars.restoreEdgeToEdge).toHaveBeenCalledTimes(2);
  });
});
