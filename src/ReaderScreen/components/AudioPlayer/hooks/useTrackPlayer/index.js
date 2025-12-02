import { useState, useEffect, useCallback } from "react";
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
import { formatUrlForTrackPlayer } from "../../utils/urlHelper";

const useTrackPlayer = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState(null);
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const [isPlaying, setIsPlaying] = useState(false);
  const isAudio = useSelector((state) => state.isAudio);

  const configurePlayer = useCallback(async () => {
    setInitializationError(null);
    setIsInitializing(true);
    try {
      // Use singleton service for initialization
      await TrackPlayerSetup();

      // Check state from singleton
      const state = getTrackPlayerState();
      setIsInitialized(state.isInitialized);
    } catch (error) {
      logError("Error initializing TrackPlayer:", error);
      setIsInitialized(false);
      setInitializationError(error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const retryInitialization = useCallback(async () => {
    if (isInitializing) {
      return;
    }
    await configurePlayer();
  }, [configurePlayer, isInitializing]);

  useEffect(() => {
    (async () => {
      await configurePlayer();
    })();

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
  }, [configurePlayer]);

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
    shouldPlay = true
  ) => {
    if (!isInitialized || !isAudio) {
      logMessage("Audio is not initialized or disabled in settings");
      return;
    }

    try {
      const track = {
        id,
        url: formatUrlForTrackPlayer(url),
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
    isInitializing,
    initializationError,
    retryInitialization,
  };
};

export default useTrackPlayer;
