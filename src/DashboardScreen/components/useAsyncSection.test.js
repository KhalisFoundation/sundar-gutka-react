/* eslint-env jest */
import { renderHook, act, waitFor } from "@testing-library/react-native";
import useAsyncSection from "./useAsyncSection";

jest.mock("@common", () => ({ logMessage: jest.fn(), logNetworkError: jest.fn() }));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("useAsyncSection", () => {
  it("reports loading for the first fetch only", async () => {
    const first = deferred();
    const task = jest.fn(() => first.promise);
    const { result } = renderHook(() => useAsyncSection(task));

    expect(result.current.loading).toBe(true);
    expect(result.current.refreshing).toBe(false);

    await act(async () => {
      first.resolve();
    });
    expect(result.current.loading).toBe(false);
  });

  it("reports refreshing on a retry AFTER data has loaded", async () => {
    // The bug this guards: `loading` deliberately never returns to true once
    // content is on screen, so a refresh control watching `loading` alone sees
    // nothing happen and appears broken for the whole fetch.
    const first = deferred();
    let current = first;
    const task = jest.fn(() => current.promise);
    const { result } = renderHook(() => useAsyncSection(task));

    await act(async () => {
      first.resolve();
    });
    expect(result.current.loading).toBe(false);

    const second = deferred();
    current = second;
    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.refreshing).toBe(true));
    // Content stays on screen — no skeleton — while the refetch runs.
    expect(result.current.loading).toBe(false);

    await act(async () => {
      second.resolve();
    });
    expect(result.current.refreshing).toBe(false);
  });

  it("clears refreshing when a refetch fails", async () => {
    const first = deferred();
    let current = first;
    const task = jest.fn(() => current.promise);
    const { result } = renderHook(() => useAsyncSection(task));
    await act(async () => {
      first.resolve();
    });

    const second = deferred();
    current = second;
    act(() => {
      result.current.retry();
    });
    await waitFor(() => expect(result.current.refreshing).toBe(true));

    await act(async () => {
      second.reject(new Error("network"));
    });
    // Must not leave the control stuck spinning forever.
    expect(result.current.refreshing).toBe(false);
    // A failed refetch keeps the last good data rather than showing an error.
    expect(result.current.error).toBe(false);
  });

  // Every section funnels its failure through here, so this is where "the
  // phone is offline" and "the source had nothing" stop being Crashlytics
  // non-fatals: they are states the section renders, and are left as
  // breadcrumbs. A real fault still goes through the network-aware recorder.
  it("leaves an expected failure as a breadcrumb and records a real one", async () => {
    jest.clearAllMocks();
    const { logMessage, logNetworkError } = jest.requireMock("@common");
    const unavailable = Object.assign(new Error("daily vaak unavailable"), { unavailable: true });
    const task = jest.fn(() => Promise.reject(unavailable));
    const { result } = renderHook(() => useAsyncSection(task));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(logMessage).toHaveBeenCalledWith("daily vaak unavailable");
    expect(logNetworkError).not.toHaveBeenCalled();
    expect(result.current.error).toBe(true);

    const fault = new Error("no such table: dashboard_daily_activity");
    const failing = jest.fn(() => Promise.reject(fault));
    const second = renderHook(() => useAsyncSection(failing));
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(logNetworkError).toHaveBeenCalledWith(fault, fault);
  });
});
