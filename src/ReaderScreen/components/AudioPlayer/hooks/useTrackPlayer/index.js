import { useState, useEffect } from "react";
import { exists } from "react-native-fs";
import TrackPlayer, { usePlaybackState, useProgress, State } from "react-native-track-player";
import { useSelector } from "react-redux";
import {
  addTrack,
  playTrack,
  pauseTrack,
  stopTrack,
  resetPlayer,
  TrackPlayerSetup,
  getTrackPlayerState,
} from "@common/TrackPlayerUtils";
import { logError, logMessage } from "@common";
import { formatUrlForTrackPlayer, isLocalFile } from "../../utils/urlHelper";

const useTrackPlayer = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const [isPlaying, setIsPlaying] = useState(false);
  const isAudio = useSelector((state) => state.isAudio);

  useEffect(() => {
    const setupPlayer = async () => {
      try {
        // Use singleton service for initialization
        await TrackPlayerSetup();

        // Check state from singleton
        const state = getTrackPlayerState();
        setIsInitialized(state.isInitialized);
      } catch (error) {
        logError("Error initializing TrackPlayer:", error);
        setIsInitialized(false);
      }
    };

    setupPlayer();

    // Cleanup function
    return () => {
      // Cleanup on unmount
      const cleanup = async () => {
        try {
          // Stop any active playback when component unmounts
          await stopTrack();
        } catch (error) {
          logError("Error during cleanup:", error);
        }
      };
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    setIsPlaying(playbackState?.state === State.Playing);
  }, [playbackState, isInitialized]);

  const play = async () => {
    if (!isInitialized || !isAudio) {
      logMessage("Audio is not initialized or disabled in settings");
      return;
    }
    try {
      await playTrack();
    } catch (error) {
      logError("Error playing track:", error);
    }
  };

  const pause = async () => {
    try {
      await pauseTrack();
    } catch (error) {
      logError("Error pausing track:", error);
    }
  };

  const stop = async () => {
    if (!isInitialized) return;
    try {
      await stopTrack();
    } catch (error) {
      logError("Error stopping track:", error);
    }
  };

  const reset = async () => {
    if (!isInitialized) return;
    try {
      await resetPlayer();
    } catch (error) {
      logError("Error resetting player:", error);
    }
  };

  const seekTo = async (position) => {
    if (!isInitialized || !isAudio) {
      logMessage("Audio is not initialized or disabled in settings");
      return;
    }
    try {
      await TrackPlayer.seekTo(position);
    } catch (error) {
      logError("Error seeking to position:", error);
    }
  };

  const addAndPlayTrack = async (
    id,
    url,
    title,
    artist,
    lyricsUrl,
    trackLengthSec,
    trackSizeMB,
    shouldPlay = true,
    fallbackUrl = null
  ) => {
    if (!isInitialized || !isAudio) {
      logMessage("Audio is not initialized or disabled in settings");
      return;
    }

    try {
      let playbackUrl = url;

      // If pointing to a local file, verify it exists; otherwise fall back to remote URL when provided
      if (isLocalFile(url)) {
        const filePath = url.startsWith("file://") ? url.replace(/^file:\/\//, "") : url;
        const fileExists = await exists(filePath);
        if (!fileExists) {
          if (fallbackUrl) {
            playbackUrl = fallbackUrl;
          } else {
            logMessage("Local audio missing and no fallback URL available");
            return;
          }
        }
      }

      const track = {
        id,
        url: formatUrlForTrackPlayer(playbackUrl),
        title,
        artist,
        lyricsUrl,
        trackLengthSec,
        trackSizeMB,
      };

      await reset();
      await addTrack(track);

      if (shouldPlay) {
        await play();
      }
    } catch (error) {
      logError("Error adding and playing track:", error);
    }
  };

  const setRate = async (rate) => {
    if (!isInitialized) {
      logMessage("Audio is not initialized");
      return;
    }
    try {
      await TrackPlayer.setRate(rate);
    } catch (error) {
      logError("Error setting playback rate:", error);
    }
  };

  return {
    isPlaying,
    playbackState,
    progress,
    play,
    pause,
    stop,
    reset,
    addAndPlayTrack,
    seekTo,
    setRate,
    isAudioEnabled: isAudio && isInitialized,
    isInitialized,
    setIsPlaying,
  };
};

export default useTrackPlayer;
