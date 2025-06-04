import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import TrackPlayer, { usePlaybackState, useProgress, State } from "react-native-track-player";
import { addTrack, playTrack, pauseTrack, stopTrack, resetPlayer } from "../utils/TrackPlayerUtils";

const useTrackPlayer = () => {
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const [isPlaying, setIsPlaying] = useState(false);
  const isAudio = useSelector((state) => state.isAudio);

  useEffect(() => {
    console.log(playbackState);
    console.log(State.Playing);
    setIsPlaying(playbackState.state === State.Playing);
  }, [playbackState]);

  const play = async () => {
    if (!isAudio) {
      console.log("Audio is disabled in settings");
      return;
    }
    try {
      await playTrack();
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  const pause = async () => {
    try {
      await pauseTrack();
    } catch (error) {
      console.error("Error pausing track:", error);
    }
  };

  const stop = async () => {
    try {
      await stopTrack();
    } catch (error) {
      console.error("Error stopping track:", error);
    }
  };

  const reset = async () => {
    try {
      await resetPlayer();
    } catch (error) {
      console.error("Error resetting player:", error);
    }
  };

  const addAndPlayTrack = async (track) => {
    if (!isAudio) {
      console.log("Audio is disabled in settings");
      return;
    }
    try {
      await reset(); // Clear current queue
      await addTrack(track);
      await play();
    } catch (error) {
      console.error("Error adding and playing track:", error);
    }
  };

  const seekTo = async (position) => {
    if (!isAudio) {
      console.log("Audio is disabled in settings");
      return;
    }
    try {
      await TrackPlayer.seekTo(position);
    } catch (error) {
      console.error("Error seeking to position:", error);
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
    isAudioEnabled: isAudio,
  };
};

export default useTrackPlayer;
