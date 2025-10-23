import { useState, useEffect } from "react";
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
  AppKilledPlaybackBehavior,
} from "react-native-track-player";
import { useSelector } from "react-redux";
import { addTrack, playTrack, pauseTrack, stopTrack, resetPlayer } from "@common/TrackPlayerUtils";
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
        // Check if player is already initialized
        const isSetup = await TrackPlayer.isServiceRunning();
        if (!isSetup) {
          // Initialize player if not already set up
          await TrackPlayer.setupPlayer({
            waitForBuffer: true,
            maxCacheSize: 1024,
            iosCategory: "playback",
            alwaysPauseOnInterruption: true,
          });
          await TrackPlayer.updateOptions({
            android: {
              appKilledPlaybackBehavior:
                AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
            },
            capabilities: [
              TrackPlayer.Capability.Play,
              TrackPlayer.Capability.Pause,
              TrackPlayer.Capability.SkipToNext,
              TrackPlayer.Capability.SkipToPrevious,
              TrackPlayer.Capability.Stop,
              TrackPlayer.Capability.SeekTo,
            ],
            compactCapabilities: [
              TrackPlayer.Capability.Play,
              TrackPlayer.Capability.Pause,
              TrackPlayer.Capability.SkipToNext,
            ],
          });
        }
        setIsInitialized(true);
      } catch (error) {
        logError("Error initializing TrackPlayer:", error);
      }
    };

    setupPlayer();
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
      await reset(); // Clear current queue
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
