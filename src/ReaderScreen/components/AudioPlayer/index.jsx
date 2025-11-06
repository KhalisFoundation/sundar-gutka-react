import React, { useState, useEffect } from "react";
import { View } from "react-native";
import TrackPlayer from "react-native-track-player";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { toggleAudio } from "@common/actions";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { showErrorToast } from "@common/toast";
import { STRINGS, CustomText, logError } from "@common";
import { AudioTrackDialog, AudioControlBar } from "./components";
import { useAudioManifest, useTrackPlayer, useAudioSyncScroll } from "./hooks";
import createStyles from "./style";

const AudioPlayer = ({ baniID, title, webViewRef }) => {
  const dispatch = useDispatch();
  const styles = useThemedStyles(createStyles);
  const [showTrackModal, setShowTrackModal] = useState(true);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const defaultAudio = useSelector((state) => state.defaultAudio);
  const audioPlaybackSpeed = useSelector((state) => state.audioPlaybackSpeed);
  const { tracks, currentPlaying, setCurrentPlaying, isLoading } = useAudioManifest(baniID);
  const {
    isPlaying,
    progress,
    play,
    pause,
    stop,
    addAndPlayTrack,
    seekTo,
    setRate,
    isAudioEnabled,
    isInitialized,
  } = useTrackPlayer();

  // Audio sync scroll hook
  useAudioSyncScroll(progress, isPlaying, webViewRef, currentPlaying?.audioUrl);

  // Apply saved playback speed when initialized
  useEffect(() => {
    if (isInitialized && audioPlaybackSpeed && setRate) {
      setRate(audioPlaybackSpeed);
    }
  }, [isInitialized, audioPlaybackSpeed, setRate]);

  // Cleanup: stop audio when component unmounts
  useEffect(() => {
    return () => {
      (async () => {
        dispatch(toggleAudio(false));
        await stop();
      })();
    };
  }, []);

  const handlePlayPause = async () => {
    if (!isInitialized || !isAudioEnabled || !currentPlaying) {
      return;
    }

    try {
      if (isPlaying) {
        await pause();
      } else {
        // Check if there's already a track loaded in the queue
        const currentTrack = await TrackPlayer.getActiveTrack();
        // If the current track matches what we want to play, just resume
        if (currentTrack && currentTrack.id === currentPlaying.id) {
          await play();
          return;
        }

        // Track not loaded, add and play it
        await addAndPlayTrack(
          currentPlaying.id,
          currentPlaying.audioUrl,
          currentPlaying.displayName,
          currentPlaying.displayName
        );
      }
    } catch (error) {
      logError("Error in handlePlayPause:", error);
      showErrorToast(`${STRINGS.UNABLE_TO_PLAY} ${STRINGS.PLEASE_TRY_AGAIN}`);
    }
  };

  const onCloseTrackModal = async () => {
    if (isPlaying) {
      await stop();
    }
    dispatch(toggleAudio(false));
  };

  useEffect(() => {
    if (isAudioAutoPlay && currentPlaying) {
      setShowTrackModal(false);
      handlePlayPause();
    }
  }, [isAudioAutoPlay, currentPlaying]);

  useEffect(() => {
    if (defaultAudio[baniID] && defaultAudio[baniID].audioUrl) {
      setShowTrackModal(false);
    }
  }, [defaultAudio, baniID]);

  const handleSeek = async (value) => {
    if (!isAudioEnabled || !isInitialized) return;
    try {
      await seekTo(value);
    } catch (error) {
      logError("Error seeking:", error);
      showErrorToast(`${STRINGS.UNABLE_TO_SEEK} ${STRINGS.PLEASE_TRY_AGAIN}`);
    }
  };

  const handleTrackSelect = async (selectedTrack) => {
    try {
      // Stop current playback
      await stop();

      // Set the new track as current
      setCurrentPlaying(selectedTrack);

      // Close the modal
      setShowTrackModal(false);

      // Auto-play the new track if audio is enabled
      if (isAudioEnabled) {
        await addAndPlayTrack(
          selectedTrack.id,
          selectedTrack.audioUrl,
          selectedTrack.displayName,
          selectedTrack.displayName
        );
      }
    } catch (error) {
      logError("Error switching track:", error);
      showErrorToast(`${STRINGS.UNABLE_TO_SWITCH_TRACK} ${STRINGS.PLEASE_TRY_AGAIN}`);
    }
  };

  // Don't render if TrackPlayer is not initialized
  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <CustomText style={styles.trackTitle}>Initializing audio player...</CustomText>
      </View>
    );
  }

  return showTrackModal ? (
    <AudioTrackDialog
      baniID={baniID}
      handleTrackSelect={handleTrackSelect}
      title={title}
      tracks={tracks}
      isLoading={isLoading}
      onCloseTrackModal={onCloseTrackModal}
    />
  ) : (
    <AudioControlBar
      baniID={baniID}
      handleTrackSelect={handleTrackSelect}
      isPlaying={isPlaying}
      handlePlayPause={handlePlayPause}
      progress={progress}
      handleSeek={handleSeek}
      isAudioEnabled={isAudioEnabled}
      title={title}
      currentPlaying={currentPlaying}
      onCloseTrackModal={onCloseTrackModal}
    />
  );
};

AudioPlayer.propTypes = {
  baniID: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  webViewRef: PropTypes.shape({
    current: PropTypes.shape({
      postMessage: PropTypes.func,
    }),
  }).isRequired,
};

export default AudioPlayer;
