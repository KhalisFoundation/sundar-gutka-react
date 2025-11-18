/* eslint-env jest */

import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import { setMockState, getMockDispatch } from "@common/test-utils/mocks/react-redux";
// eslint-disable-next-line import/order
import useBookmarks from "./index";

// Mock dependencies
jest.mock("@common", () => ({
  actions: {
    setBookmarkSequenceString: jest.fn((value) => ({
      type: "SET_BOOKMARK_SEQUENCE_STRING",
      value,
    })),
  },
  logMessage: jest.fn(),
  logError: jest.fn(),
}));

jest.mock("../../utils/fetchLRC", () => jest.fn());

const { actions, logMessage, logError } = require("@common");
const fetchLRCDataMock = require("../../utils/fetchLRC");

// Test component that uses the hook
const TestComponent = ({ seekTo, url, onResult }) => {
  useBookmarks(seekTo, url);

  React.useEffect(() => {
    if (onResult) {
      onResult();
    }
  }, [onResult]);

  return null;
};

describe("useBookmarks", () => {
  const mockSeekTo = jest.fn();
  const mockUrl = "https://example.com/lyrics.json";

  beforeEach(() => {
    jest.clearAllMocks();
    fetchLRCDataMock.mockReset();
    mockSeekTo.mockReset();
    mockSeekTo.mockResolvedValue(undefined);
    logMessage.mockClear();
    logError.mockClear();
    setMockState({
      bookmarkSequenceString: null,
      isParagraphMode: false,
    });
  });

  describe("getBookmarkSequenceString", () => {
    it("should return null when sequenceString is missing", async () => {
      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      // Wait for effects to complete
      await waitFor(() => {
        expect(fetchLRCDataMock).not.toHaveBeenCalled();
      });
    });

    it("should return null when lyricsUrl is missing", async () => {
      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={null} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).not.toHaveBeenCalled();
      });
    });

    it("should return null when LRC data is not available", async () => {
      fetchLRCDataMock.mockResolvedValueOnce(false);

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logMessage).toHaveBeenCalledWith(
          "LRC data not available or empty for bookmark sequence"
        );
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should return null when LRC data is empty array", async () => {
      fetchLRCDataMock.mockResolvedValueOnce([]);

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logMessage).toHaveBeenCalledWith(
          "LRC data not available or empty for bookmark sequence"
        );
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should extract sequence number correctly in normal mode", async () => {
      const mockLRCData = [
        { sequence: 1, start: 10.5 },
        { sequence: 2, start: 20.5 },
        { sequence: 3, start: 30.5 },
      ];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "2",
        isParagraphMode: false,
      });

      const mockDispatch = getMockDispatch();

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(mockSeekTo).toHaveBeenCalledWith(20.5);
        expect(logMessage).toHaveBeenCalledWith("Found bookmark position: 20.5s for sequence 2");
        expect(mockDispatch).toHaveBeenCalledWith(actions.setBookmarkSequenceString(null));
      });
    });

    it("should extract sequence number correctly in paragraph mode", async () => {
      const mockLRCData = [
        { sequence: 123, start: 10.5 },
        { sequence: 456, start: 20.5 },
        { sequence: 789, start: 30.5 },
      ];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "|123|456|",
        isParagraphMode: true,
      });

      const mockDispatch = getMockDispatch();

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(mockSeekTo).toHaveBeenCalledWith(10.5);
        expect(logMessage).toHaveBeenCalledWith("Found bookmark position: 10.5s for sequence 123");
        expect(mockDispatch).toHaveBeenCalledWith(actions.setBookmarkSequenceString(null));
      });
    });

    it("should handle paragraph mode with extra whitespace", async () => {
      const mockLRCData = [{ sequence: 456, start: 20.5 }];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "| 456 | 789 |",
        isParagraphMode: true,
      });

      const mockDispatch = getMockDispatch();

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(mockSeekTo).toHaveBeenCalledWith(20.5);
        expect(mockDispatch).toHaveBeenCalledWith(actions.setBookmarkSequenceString(null));
      });
    });

    it("should return null for invalid sequence numbers (non-integer)", async () => {
      const mockLRCData = [{ sequence: 1, start: 10.5 }];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "abc",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith("Invalid sequence number extracted: abc");
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should return null for invalid sequence numbers (zero)", async () => {
      const mockLRCData = [{ sequence: 1, start: 10.5 }];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "0",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith("Invalid sequence number extracted: 0");
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should return null for invalid sequence numbers (negative)", async () => {
      const mockLRCData = [{ sequence: 1, start: 10.5 }];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "-1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith("Invalid sequence number extracted: -1");
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should return null when sequence not found in data", async () => {
      const mockLRCData = [
        { sequence: 1, start: 10.5 },
        { sequence: 2, start: 20.5 },
      ];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "999",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logMessage).toHaveBeenCalledWith("Sequence 999 not found in LRC data");
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should return null when start time is null", async () => {
      const mockLRCData = [
        { sequence: 1, start: null },
        { sequence: 2, start: 20.5 },
      ];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith("Invalid start time for sequence 1");
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should return null when start time is undefined", async () => {
      const mockLRCData = [{ sequence: 1 }, { sequence: 2, start: 20.5 }];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith("Invalid start time for sequence 1");
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should return null when start time is not a number", async () => {
      const mockLRCData = [
        { sequence: 1, start: "invalid" },
        { sequence: 2, start: 20.5 },
      ];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith("Invalid start time for sequence 1");
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should return null when start time is negative", async () => {
      const mockLRCData = [
        { sequence: 1, start: -10.5 },
        { sequence: 2, start: 20.5 },
      ];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith("Invalid start time for sequence 1");
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should return correct start time when valid", async () => {
      const mockLRCData = [
        { sequence: 1, start: 10.5 },
        { sequence: 2, start: 20.5 },
        { sequence: 3, start: 30.5 },
      ];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "3",
        isParagraphMode: false,
      });

      const mockDispatch = getMockDispatch();

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(mockSeekTo).toHaveBeenCalledWith(30.5);
        expect(logMessage).toHaveBeenCalledWith("Found bookmark position: 30.5s for sequence 3");
        expect(mockDispatch).toHaveBeenCalledWith(actions.setBookmarkSequenceString(null));
      });
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Network error");
      fetchLRCDataMock.mockRejectedValueOnce(error);

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith("Error getting bookmark sequence timestamp:", error);
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });
  });

  describe("useEffect behavior", () => {
    it("should not call seekTo when bookmarkSequenceString is missing", async () => {
      setMockState({
        bookmarkSequenceString: null,
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).not.toHaveBeenCalled();
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should not call seekTo when url is missing", async () => {
      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={null} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).not.toHaveBeenCalled();
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should not call seekTo when seekTo function is missing", async () => {
      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={null} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).not.toHaveBeenCalled();
      });
    });

    it("should not call seekTo when position is null", async () => {
      fetchLRCDataMock.mockResolvedValueOnce(null);

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should not call seekTo when position is 0", async () => {
      const mockLRCData = [{ sequence: 1, start: 0 }];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        // Position is 0, which is not > 0, so seekTo should not be called
        expect(mockSeekTo).not.toHaveBeenCalled();
      });
    });

    it("should call seekTo with correct position and clear bookmark", async () => {
      const mockLRCData = [{ sequence: 1, start: 15.75 }];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      const mockDispatch = getMockDispatch();

      render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(mockSeekTo).toHaveBeenCalledWith(15.75);
        expect(mockDispatch).toHaveBeenCalledWith(actions.setBookmarkSequenceString(null));
      });
    });

    it("should re-run when bookmarkSequenceString changes", async () => {
      const mockLRCData1 = [{ sequence: 1, start: 10.5 }];
      const mockLRCData2 = [{ sequence: 2, start: 20.5 }];

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData1);

      const { rerender } = render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(mockSeekTo).toHaveBeenCalledWith(10.5);
      });

      // Clear the mock to verify it's called again
      mockSeekTo.mockClear();
      fetchLRCDataMock.mockClear();

      // Update bookmarkSequenceString and re-render
      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData2);

      act(() => {
        setMockState({
          bookmarkSequenceString: "2",
          isParagraphMode: false,
        });
      });

      rerender(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(mockSeekTo).toHaveBeenCalledWith(20.5);
      });
    });

    it("should re-run when url changes", async () => {
      const mockLRCData = [{ sequence: 1, start: 10.5 }];

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      setMockState({
        bookmarkSequenceString: "1",
        isParagraphMode: false,
      });

      const { rerender } = render(
        <TestComponent seekTo={mockSeekTo} url="https://example.com/lyrics1.json" />
      );

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith("https://example.com/lyrics1.json");
      });

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      rerender(<TestComponent seekTo={mockSeekTo} url="https://example.com/lyrics2.json" />);

      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith("https://example.com/lyrics2.json");
      });
    });

    it("should re-run when isParagraphMode changes", async () => {
      const mockLRCData = [{ sequence: 123, start: 10.5 }];

      setMockState({
        bookmarkSequenceString: "|123|456|",
        isParagraphMode: false, // Initially false, but sequence string is in paragraph format
      });

      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      const { rerender } = render(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      // In normal mode, "|123|456|" will be parsed as NaN
      await waitFor(() => {
        expect(fetchLRCDataMock).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(logError).toHaveBeenCalled();
      });

      // Clear mocks
      mockSeekTo.mockClear();
      fetchLRCDataMock.mockClear();
      logError.mockClear();

      // Now switch to paragraph mode
      fetchLRCDataMock.mockResolvedValueOnce(mockLRCData);

      act(() => {
        setMockState({
          bookmarkSequenceString: "|123|456|",
          isParagraphMode: true,
        });
      });

      rerender(<TestComponent seekTo={mockSeekTo} url={mockUrl} />);

      await waitFor(() => {
        expect(mockSeekTo).toHaveBeenCalledWith(10.5);
      });
    });
  });
});
