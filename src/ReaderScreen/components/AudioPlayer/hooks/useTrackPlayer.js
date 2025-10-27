import { useState, useEffect } from "react";
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
    if (!isInitialized) return;
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

  const addAndPlayTrack = async (track) => {
    if (!isInitialized || !isAudio) {
      logMessage("Audio is not initialized or disabled in settings");
      return;
    }
    try {
      await reset();
      await addTrack(track);
      await play();
    } catch (error) {
      logError("Error adding and playing track:", error);
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
