/* eslint-env jest */

import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import { setMockState, getMockDispatch } from "@common/test-utils/mocks/react-redux";
// eslint-disable-next-line import/order
import useAudioManifest from "./index";
// Mock dependencies
jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/mock/document/path",
}));

jest.mock("@common", () => ({
  actions: {
    setAudioManifest: jest.fn((baniId, tracks) => ({
      type: "SET_AUDIO_MANIFEST",
      payload: { baniId, tracks },
    })),
  },
  logError: jest.fn(),
}));

jest.mock("@service", () => ({
  fetchManifest: jest.fn(),
}));

const { actions, logError } = require("@common");
const { fetchManifest } = require("@service");

// Test component that uses the hook
const TestComponent = ({ baniID, onResult }) => {
  const result = useAudioManifest(baniID);

  React.useEffect(() => {
    if (onResult) {
      onResult(result);
    }
  }, [result, onResult]);

  return null;
};

describe("useAudioManifest", () => {
  const mockBaniID = "test-bani-123";

  beforeEach(() => {
    jest.clearAllMocks();
    setMockState({
      defaultAudio: {},
      audioManifest: {},
    });
  });

  describe("fetchAudioManifest", () => {
    it("should fetch and map API manifest data to tracks", async () => {
      const mockManifest = {
        data: [
          {
            track_id: 1,
            artist_id: 1,
            track_url: "https://example.com/track1.mp3",
            artist_name: "Artist One",
            track_length_seconds: 300,
            track_size_mb: 5.2,
          },
          {
            track_id: 2,
            artist_id: 2,
            track_url: "https://example.com/track2.mp3",
            artist_name: "Artist Two",
            track_length_seconds: 250,
            track_size_mb: 4.8,
          },
        ],
      };

      fetchManifest.mockResolvedValueOnce(mockManifest);

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(fetchManifest).toHaveBeenCalledWith(mockBaniID);
      });

      await waitFor(() => {
        expect(hookResult?.tracks).toHaveLength(2);
        expect(hookResult?.isTracksLoading).toBe(false);
      });

      expect(hookResult.tracks[0]).toMatchObject({
        id: 1,
        track_id: 1,
        artistID: 1,
        audioUrl: "https://example.com/track1.mp3",
        displayName: "Artist One",
        trackLengthSec: 300,
        trackSizeMB: 5.2,
        lyricsUrl: "https://example.com/track1.json",
      });

      expect(hookResult.tracks[1]).toMatchObject({
        id: 2,
        track_id: 2,
        artistID: 2,
        audioUrl: "https://example.com/track2.mp3",
        displayName: "Artist Two",
        trackLengthSec: 250,
        trackSizeMB: 4.8,
        lyricsUrl: "https://example.com/track2.json",
      });

      unmount();
    });

    it("should handle empty manifest data", async () => {
      fetchManifest.mockResolvedValueOnce({ data: [] });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(fetchManifest).toHaveBeenCalledWith(mockBaniID);
      });

      await waitFor(() => {
        expect(hookResult?.isTracksLoading).toBe(false);
      });

      expect(hookResult.tracks).toHaveLength(0);
      expect(hookResult.currentPlaying).toBeNull();

      unmount();
    });

    it("should handle null manifest response", async () => {
      fetchManifest.mockResolvedValueOnce(null);

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(fetchManifest).toHaveBeenCalledWith(mockBaniID);
      });

      await waitFor(() => {
        expect(hookResult?.isTracksLoading).toBe(false);
      });

      expect(hookResult.tracks).toHaveLength(0);
      expect(hookResult.currentPlaying).toBeNull();

      unmount();
    });

    it("should merge downloaded tracks with API tracks", async () => {
      const mockManifest = {
        data: [
          {
            track_id: 1,
            artist_id: 1,
            track_url: "https://example.com/track1.mp3",
            artist_name: "Artist One",
            track_length_seconds: 300,
            track_size_mb: 5.2,
          },
        ],
      };

      const downloadedTracks = [
        {
          id: 1,
          track_id: 1,
          artistID: 1,
          audioUrl: "track1.mp3",
          displayName: "Artist One",
          trackLengthSec: 300,
          trackSizeMB: 5.2,
          lyricsUrl: "track1.json",
        },
      ];

      fetchManifest.mockResolvedValueOnce(mockManifest);
      setMockState({
        audioManifest: {
          [mockBaniID]: downloadedTracks,
        },
      });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult?.tracks).toHaveLength(1);
      });

      expect(hookResult.tracks[0].audioUrl).toBe("/mock/document/path/audio/track1.mp3");
      expect(hookResult.tracks[0].lyricsUrl).toBe("/mock/document/path/audio/track1.json");

      unmount();
    });

    it("should use downloaded tracks when API returns no data", async () => {
      const downloadedTracks = [
        {
          id: 1,
          track_id: 1,
          artistID: 1,
          audioUrl: "track1.mp3",
          displayName: "Artist One",
          trackLengthSec: 300,
          trackSizeMB: 5.2,
          lyricsUrl: "track1.json",
        },
      ];

      fetchManifest.mockResolvedValueOnce(null);
      setMockState({
        audioManifest: {
          [mockBaniID]: downloadedTracks,
        },
      });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult?.tracks).toHaveLength(1);
      });

      expect(hookResult.tracks[0].audioUrl).toBe("/mock/document/path/audio/track1.mp3");
      expect(hookResult.tracks[0].lyricsUrl).toBe("/mock/document/path/audio/track1.json");

      unmount();
    });

    it("should set default track based on user preferences", async () => {
      const mockManifest = {
        data: [
          {
            track_id: 1,
            artist_id: 1,
            track_url: "https://example.com/track1.mp3",
            artist_name: "Artist One",
            track_length_seconds: 300,
            track_size_mb: 5.2,
          },
          {
            track_id: 2,
            artist_id: 2,
            track_url: "https://example.com/track2.mp3",
            artist_name: "Artist Two",
            track_length_seconds: 250,
            track_size_mb: 4.8,
          },
        ],
      };

      fetchManifest.mockResolvedValueOnce(mockManifest);
      setMockState({
        defaultAudio: {
          [mockBaniID]: {
            artistID: 2,
          },
        },
      });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult?.tracks).toHaveLength(2);
      });

      // Should set track-2 as current playing because it matches defaultAudio preference
      expect(hookResult.currentPlaying).toEqual(hookResult.tracks[1]);
      expect(hookResult.currentPlaying.artistID).toBe(2);

      unmount();
    });

    it("should handle fetch errors gracefully", async () => {
      const error = new Error("Network error");
      fetchManifest.mockRejectedValueOnce(error);

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(fetchManifest).toHaveBeenCalledWith(mockBaniID);
      });

      await waitFor(() => {
        expect(hookResult?.isTracksLoading).toBe(false);
      });

      expect(logError).toHaveBeenCalledWith("Error fetching manifest:", error);
      expect(hookResult.tracks).toHaveLength(0);

      unmount();
    });

    it("should set loading state during fetch", async () => {
      let resolveFetch;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      fetchManifest.mockReturnValueOnce(fetchPromise);

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      // Should be loading initially
      await waitFor(() => {
        expect(hookResult?.isTracksLoading).toBe(true);
      });

      // Resolve the fetch
      act(() => {
        resolveFetch({
          data: [
            {
              track_id: 1,
              artist_id: 1,
              track_url: "https://example.com/track1.mp3",
              artist_name: "Artist One",
              track_length_seconds: 300,
              track_size_mb: 5.2,
            },
          ],
        });
      });

      await waitFor(() => {
        expect(hookResult?.isTracksLoading).toBe(false);
      });

      unmount();
    });
  });

  describe("addTrackToManifest", () => {
    it("should add a new track to manifest", async () => {
      fetchManifest.mockResolvedValueOnce({ data: [] });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult).toBeDefined();
      });

      const mockDispatch = getMockDispatch();
      const track = {
        id: 1,
        track_id: 1,
        artistID: 1,
        displayName: "Artist One",
        trackLengthSec: 300,
        trackSizeMB: 5.2,
      };

      act(() => {
        hookResult.addTrackToManifest(track, "track1.mp3", "track1.json");
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        actions.setAudioManifest(mockBaniID, [
          {
            id: 1,
            track_id: 1,
            artistID: 1,
            audioUrl: "track1.mp3",
            displayName: "Artist One",
            trackLengthSec: 300,
            trackSizeMB: 5.2,
            lyricsUrl: "track1.json",
          },
        ])
      );

      unmount();
    });

    it("should not add duplicate tracks", async () => {
      const existingTracks = [
        {
          id: 1,
          track_id: 1,
          artistID: 1,
          audioUrl: "track1.mp3",
          displayName: "Artist One",
          trackLengthSec: 300,
          trackSizeMB: 5.2,
          lyricsUrl: "track1.json",
        },
      ];

      fetchManifest.mockResolvedValueOnce({ data: [] });
      setMockState({
        audioManifest: {
          [mockBaniID]: existingTracks,
        },
      });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult).toBeDefined();
      });

      const mockDispatch = getMockDispatch();
      const track = {
        id: 1,
        track_id: 1,
        artistID: 1,
        displayName: "Artist One",
        trackLengthSec: 300,
        trackSizeMB: 5.2,
      };

      act(() => {
        hookResult.addTrackToManifest(track, "track1.mp3", "track1.json");
      });

      // Should not dispatch since track already exists
      expect(mockDispatch).not.toHaveBeenCalled();

      unmount();
    });

    it("should handle null lyricsUrl", async () => {
      fetchManifest.mockResolvedValueOnce({ data: [] });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult).toBeDefined();
      });

      const mockDispatch = getMockDispatch();
      const track = {
        id: 1,
        track_id: 1,
        artistID: 1,
        displayName: "Artist One",
        trackLengthSec: 300,
        trackSizeMB: 5.2,
      };

      act(() => {
        hookResult.addTrackToManifest(track, "track1.mp3", null);
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        actions.setAudioManifest(mockBaniID, [
          {
            id: 1,
            track_id: 1,
            artistID: 1,
            audioUrl: "track1.mp3",
            displayName: "Artist One",
            trackLengthSec: 300,
            trackSizeMB: 5.2,
            lyricsUrl: null,
          },
        ])
      );

      unmount();
    });
  });

  describe("isTrackDownloaded", () => {
    it("should return true for downloaded track with audio and lyrics", async () => {
      const downloadedTracks = [
        {
          id: 1,
          track_id: 1,
          artistID: 1,
          audioUrl: "/local/path/track1.mp3",
          displayName: "Artist One",
          trackLengthSec: 300,
          trackSizeMB: 5.2,
          lyricsUrl: "/local/path/track1.json",
        },
      ];

      fetchManifest.mockResolvedValueOnce({ data: [] });
      setMockState({
        audioManifest: {
          [mockBaniID]: downloadedTracks,
        },
      });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult).toBeDefined();
      });

      expect(hookResult.isTrackDownloaded(1)).toBe(true);

      unmount();
    });

    it("should return true for downloaded track without lyrics", async () => {
      const downloadedTracks = [
        {
          id: 1,
          track_id: 1,
          artistID: 1,
          audioUrl: "/local/path/track1.mp3",
          displayName: "Artist One",
          trackLengthSec: 300,
          trackSizeMB: 5.2,
          lyricsUrl: null,
        },
      ];

      fetchManifest.mockResolvedValueOnce({ data: [] });
      setMockState({
        audioManifest: {
          [mockBaniID]: downloadedTracks,
        },
      });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult).toBeDefined();
      });

      expect(hookResult.isTrackDownloaded(1)).toBe(true);

      unmount();
    });

    it("should return false for track with remote audio URL", async () => {
      const tracks = [
        {
          id: 1,
          track_id: 1,
          artistID: 1,
          audioUrl: "https://example.com/track1.mp3",
          displayName: "Artist One",
          trackLengthSec: 300,
          trackSizeMB: 5.2,
          lyricsUrl: "https://example.com/track1.json",
        },
      ];

      fetchManifest.mockResolvedValueOnce({ data: [] });
      setMockState({
        audioManifest: {
          [mockBaniID]: tracks,
        },
      });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult).toBeDefined();
      });

      expect(hookResult.isTrackDownloaded("track-1")).toBe(false);

      unmount();
    });

    it("should return false for track with remote lyrics URL", async () => {
      const tracks = [
        {
          id: 1,
          track_id: 1,
          artistID: 1,
          audioUrl: "/local/path/track1.mp3",
          displayName: "Artist One",
          trackLengthSec: 300,
          trackSizeMB: 5.2,
          lyricsUrl: "https://example.com/track1.json",
        },
      ];

      fetchManifest.mockResolvedValueOnce({ data: [] });
      setMockState({
        audioManifest: {
          [mockBaniID]: tracks,
        },
      });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult).toBeDefined();
      });

      expect(hookResult.isTrackDownloaded(1)).toBe(false);

      unmount();
    });

    it("should return false for non-existent track", async () => {
      fetchManifest.mockResolvedValueOnce({ data: [] });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult).toBeDefined();
      });

      expect(hookResult.isTrackDownloaded("non-existent-track")).toBe(false);

      unmount();
    });

    it("should handle errors gracefully", async () => {
      fetchManifest.mockResolvedValueOnce({ data: [] });
      setMockState({
        audioManifest: null, // Invalid state to trigger error
      });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult).toBeDefined();
      });

      expect(hookResult.isTrackDownloaded("track-1")).toBe(false);

      unmount();
    });
  });

  describe("setCurrentPlaying", () => {
    it("should allow setting current playing track", async () => {
      const mockManifest = {
        data: [
          {
            track_id: 1,
            artist_id: 1,
            track_url: "https://example.com/track1.mp3",
            artist_name: "Artist One",
            track_length_seconds: 300,
            track_size_mb: 5.2,
          },
          {
            track_id: 2,
            artist_id: 2,
            track_url: "https://example.com/track2.mp3",
            artist_name: "Artist Two",
            track_length_seconds: 250,
            track_size_mb: 4.8,
          },
        ],
      };

      fetchManifest.mockResolvedValueOnce(mockManifest);

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult?.tracks).toHaveLength(2);
      });

      // Initially should be first track
      expect(hookResult.currentPlaying).toBeNull();

      // Set to second track
      act(() => {
        hookResult.setCurrentPlaying(hookResult.tracks[1]);
      });

      expect(hookResult.currentPlaying).toEqual(hookResult.tracks[1]);

      unmount();
    });
  });

  describe("edge cases", () => {
    it("should handle track_url without .mp3 extension", async () => {
      const mockManifest = {
        data: [
          {
            track_id: 1,
            artist_id: 1,
            track_url: "https://example.com/track1",
            artist_name: "Artist One",
            track_length_seconds: 300,
            track_size_mb: 5.2,
          },
        ],
      };

      fetchManifest.mockResolvedValueOnce(mockManifest);

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult?.tracks).toHaveLength(1);
      });

      // Should still create lyricsUrl by replacing .mp3, but since there's no .mp3, replace returns original
      expect(hookResult.tracks[0].lyricsUrl).toBe("https://example.com/track1");

      unmount();
    });

    it("should handle defaultAudio with string artistID matching number", async () => {
      const mockManifest = {
        data: [
          {
            track_id: 1,
            artist_id: 123,
            track_url: "https://example.com/track1.mp3",
            artist_name: "Artist One",
            track_length_seconds: 300,
            track_size_mb: 5.2,
          },
        ],
      };

      fetchManifest.mockResolvedValueOnce(mockManifest);
      setMockState({
        defaultAudio: {
          [mockBaniID]: {
            artistID: "123", // String version
          },
        },
      });

      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={mockBaniID}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      await waitFor(() => {
        expect(hookResult?.tracks).toHaveLength(1);
      });

      // Should match even though one is string and one is number
      expect(hookResult.currentPlaying.artistID).toBe(123);

      unmount();
    });

    it("should not fetch when baniID is not provided", async () => {
      let hookResult;
      const { unmount } = render(
        <TestComponent
          baniID={null}
          onResult={(result) => {
            hookResult = result;
          }}
        />
      );

      // Wait a bit to ensure useEffect has run
      await waitFor(
        () => {
          expect(hookResult).toBeDefined();
        },
        { timeout: 100 }
      );

      // Should not call fetchManifest
      expect(fetchManifest).not.toHaveBeenCalled();

      unmount();
    });

    it("should refetch when baniID changes", async () => {
      const mockManifest1 = {
        data: [
          {
            track_id: 1,
            artist_id: 1,
            track_url: "https://example.com/track1.mp3",
            artist_name: "Artist One",
            track_length_seconds: 300,
            track_size_mb: 5.2,
          },
        ],
      };

      const mockManifest2 = {
        data: [
          {
            track_id: 2,
            artist_id: 2,
            track_url: "https://example.com/track2.mp3",
            artist_name: "Artist Two",
            track_length_seconds: 250,
            track_size_mb: 4.8,
          },
        ],
      };

      fetchManifest.mockResolvedValueOnce(mockManifest1).mockResolvedValueOnce(mockManifest2);

      const { rerender, unmount } = render(<TestComponent baniID="bani-1" />);

      await waitFor(() => {
        expect(fetchManifest).toHaveBeenCalledWith("bani-1");
      });

      rerender(<TestComponent baniID="bani-2" />);

      await waitFor(() => {
        expect(fetchManifest).toHaveBeenCalledWith("bani-2");
      });

      expect(fetchManifest).toHaveBeenCalledTimes(2);

      unmount();
    });
  });
});
