/* eslint-env jest */
import { AppState, NativeModules, Platform } from "react-native";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import {
  clearWebViewAvailabilityCache,
  isWebViewAvailable,
  useWebViewAvailable,
} from "./webViewAvailability";

// The Reader is a WebView. On a phone whose WebView provider is disabled,
// uninstalled or mid-update, mounting one throws inside the native constructor
// and the process dies — the rollout's fatal. The probe below is what lets a
// screen ask first.

beforeEach(() => {
  jest.clearAllMocks();
  clearWebViewAvailabilityCache();
  Platform.OS = "android";
  NativeModules.WebViewAvailability = { isAvailable: jest.fn(() => Promise.resolve(true)) };
});

describe("isWebViewAvailable", () => {
  it("asks the native probe on Android and remembers a yes", async () => {
    await expect(isWebViewAvailable()).resolves.toBe(true);
    await expect(isWebViewAvailable()).resolves.toBe(true);
    expect(NativeModules.WebViewAvailability.isAvailable).toHaveBeenCalledTimes(1);
  });

  it("asks again after a no, so installing the provider is noticed", async () => {
    NativeModules.WebViewAvailability.isAvailable
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    await expect(isWebViewAvailable()).resolves.toBe(false);
    await expect(isWebViewAvailable()).resolves.toBe(true);
    expect(NativeModules.WebViewAvailability.isAvailable).toHaveBeenCalledTimes(2);
  });

  it("is always yes on iOS, and on a build without the probe", async () => {
    Platform.OS = "ios";
    await expect(isWebViewAvailable()).resolves.toBe(true);
    expect(NativeModules.WebViewAvailability.isAvailable).not.toHaveBeenCalled();

    Platform.OS = "android";
    delete NativeModules.WebViewAvailability;
    await expect(isWebViewAvailable()).resolves.toBe(true);
  });
});

describe("useWebViewAvailable", () => {
  it("starts unknown, settles on the probe's answer, and re-asks on foreground while no", async () => {
    NativeModules.WebViewAvailability.isAvailable
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    let onChange;
    jest.spyOn(AppState, "addEventListener").mockImplementation((_, cb) => {
      onChange = cb;
      return { remove: jest.fn() };
    });
    const { result } = renderHook(() => useWebViewAvailable());

    expect(result.current.available).toBeNull();
    await waitFor(() => expect(result.current.available).toBe(false));

    // Back from the store with the provider installed.
    await act(async () => {
      onChange("active");
    });
    await waitFor(() => expect(result.current.available).toBe(true));
  });

  it("is settled from the start where the answer is already known", () => {
    Platform.OS = "ios";
    const { result } = renderHook(() => useWebViewAvailable());
    expect(result.current.available).toBe(true);
  });
});
