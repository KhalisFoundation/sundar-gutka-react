/* eslint-env jest */

import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { setMockState } from "@common/test-utils/mocks/react-redux";
import fetchLRCData from "../../utils/fetchLRC";
import useAudioSyncScroll from "./index";

jest.mock("../../utils/fetchLRC", () => jest.fn());

const createWebViewRef = () => ({
  current: {
    postMessage: jest.fn(),
  },
});

const TestComponent = ({ progress, isPlaying, lyricsUrl, webViewRef, onResult }) => {
  const result = useAudioSyncScroll(progress, isPlaying, webViewRef, lyricsUrl);

  React.useEffect(() => {
    if (onResult) {
      onResult(result);
    }
  }, [result, onResult]);

  return null;
};

describe("useAudioSyncScroll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMockState({
      isAudioSyncScroll: true,
      isParagraphMode: false,
    });
  });

  afterEach(() => {
    jest.clearAllTimers?.(); // no-op in some environments, safe to call
  });

  it("loads LRC data when lyricsUrl and audio sync scroll are enabled", async () => {
    fetchLRCData.mockResolvedValueOnce([]);

    const lyricsUrl = "https://example.com/audio.json";
    const webViewRef = createWebViewRef();

    const { unmount } = render(
      <TestComponent
        progress={{ position: 0 }}
        isPlaying={false}
        lyricsUrl={lyricsUrl}
        webViewRef={webViewRef}
      />
    );

    // Wait for effect -> fetch -> state update
    await waitFor(() => {
      expect(fetchLRCData).toHaveBeenCalledTimes(1);
    });

    expect(fetchLRCData).toHaveBeenCalledWith("https://example.com/audio.json");

    unmount();
  });

  it("does not load LRC data when lyricsUrl is missing or sync scroll is disabled", async () => {
    setMockState({
      isAudioSyncScroll: false,
      isParagraphMode: false,
    });

    const webViewRef = createWebViewRef();

    const { unmount } = render(
      <TestComponent
        progress={{ position: 0 }}
        isPlaying={false}
        lyricsUrl={null}
        webViewRef={webViewRef}
      />
    );

    // Give React a chance to run effects — this will pass immediately if never called
    await waitFor(() => {
      expect(fetchLRCData).not.toHaveBeenCalled();
    });

    unmount();
  });

  it("scrolls WebView to the correct sequence when progress enters a new range", async () => {
    const lrcData = [
      { start: 0, end: 5, sequence: 1 },
      { start: 5, end: 10, sequence: 2 },
    ];
    fetchLRCData.mockResolvedValueOnce(lrcData);

    const lyricsUrl = "https://example.com/audio.json";
    const webViewRef = createWebViewRef();
    const onResult = jest.fn();

    const { rerender, unmount } = render(
      <TestComponent
        progress={{ position: 0 }}
        isPlaying={false}
        lyricsUrl={lyricsUrl}
        webViewRef={webViewRef}
        onResult={onResult}
      />
    );

    // Wait for LRC data to be fetched
    await waitFor(() => {
      expect(fetchLRCData).toHaveBeenCalledTimes(1);
    });

    // Now simulate audio playing inside first timestamp range
    rerender(
      <TestComponent
        progress={{ position: 2 }}
        isPlaying
        lyricsUrl={lyricsUrl}
        webViewRef={webViewRef}
        onResult={onResult}
      />
    );

    // Wait until the scroll message is sent
    await waitFor(() => {
      const calls = webViewRef.current.postMessage.mock.calls;
      const scrollCalls = calls.filter(call => JSON.parse(call[0]).action === "scrollToSequence");
      expect(scrollCalls.length).toBe(1);
    });

    const calls = webViewRef.current.postMessage.mock.calls;
    const scrollCalls = calls.filter(call => JSON.parse(call[0]).action === "scrollToSequence");
    const message = JSON.parse(scrollCalls[0][0]);
    expect(message.action).toBe("scrollToSequence");
    expect(message.sequence).toBe(1);
    expect(message.behavior).toBe("auto");
    expect(message.isParagraphMode).toBe(false);

    // Hook result should indicate scrolling is enabled
    const lastResult = onResult.mock.calls[onResult.mock.calls.length - 1][0];
    expect(lastResult.isScrollingEnabled).toBe(true);
    expect(lastResult.currentSequence).toBe(1);

    unmount();
  });

  it("does not send scroll message for invalid sequence values", async () => {
    const lrcData = [{ start: 0, end: 5, sequence: 0 }]; // invalid sequence (less than 1)
    fetchLRCData.mockResolvedValueOnce(lrcData);

    const lyricsUrl = "https://example.com/audio.json";
    const webViewRef = createWebViewRef();

    const { rerender, unmount } = render(
      <TestComponent
        progress={{ position: 0 }}
        isPlaying={false}
        lyricsUrl={lyricsUrl}
        webViewRef={webViewRef}
      />
    );

    await waitFor(() => {
      expect(fetchLRCData).toHaveBeenCalledTimes(1);
    });

    rerender(
      <TestComponent
        progress={{ position: 2 }}
        isPlaying
        lyricsUrl={lyricsUrl}
        webViewRef={webViewRef}
      />
    );

    // Give the effect a chance to run
    await waitFor(() => {
      // still should not have sent any scroll message
      const calls = webViewRef.current.postMessage.mock.calls;
      const scrollCalls = calls.filter(call => {
        try {
          return JSON.parse(call[0]).action === "scrollToSequence";
        } catch (e) {
          return false;
        }
      });
      expect(scrollCalls.length).toBe(0);
    });

    unmount();
  });

  it("resets scrolling state when sync scroll is disabled or audio stops", async () => {
    const lrcData = [{ start: 0, end: 5, sequence: 1 }];
    fetchLRCData.mockResolvedValueOnce(lrcData);

    const lyricsUrl = "https://example.com/audio.json";
    const webViewRef = createWebViewRef();
    const onResult = jest.fn();

    const { rerender, unmount } = render(
      <TestComponent
        progress={{ position: 2 }}
        isPlaying
        lyricsUrl={lyricsUrl}
        webViewRef={webViewRef}
        onResult={onResult}
      />
    );

    await waitFor(() => {
      expect(fetchLRCData).toHaveBeenCalledTimes(1);
    });

    // Disable sync scroll
    setMockState({
      isAudioSyncScroll: false,
      isParagraphMode: false,
    });

    rerender(
      <TestComponent
        progress={{ position: 2 }}
        isPlaying={false}
        lyricsUrl={lyricsUrl}
        webViewRef={webViewRef}
        onResult={onResult}
      />
    );

    // Wait for hook to reflect updated Redux state / props
    await waitFor(() => {
      const lastResult = onResult.mock.calls[onResult.mock.calls.length - 1][0];
      expect(lastResult.isScrollingEnabled).toBe(false);
    });

    unmount();
  });
});
