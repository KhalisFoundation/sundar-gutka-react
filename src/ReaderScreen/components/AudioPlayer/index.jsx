import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import TrackPlayer from "react-native-track-player";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { toggleAudio, logError } from "@common/actions";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { showErrorToast } from "@common/toast";
import { STRINGS } from "@common";
import { AudioTrackDialog, AudioControlBar } from "./components";
import { useAudioManifest, useTrackPlayer, useAudioSyncScroll } from "./hooks";
import createStyles from "./style";
import { formatUrlForTrackPlayer } from "./utils/urlHelper";

const AudioPlayer = ({ baniID, title, shouldNavigateBack, webViewRef }) => {
  const dispatch = useDispatch();
  const styles = useThemedStyles(createStyles);
  const [showTrackModal, setShowTrackModal] = useState(true);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const defaultAudio = useSelector((state) => state.defaultAudio);
  const audioPlaybackSpeed = useSelector((state) => state.audioPlaybackSpeed);
  // Custom hooks
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

  useEffect(() => {
    if (shouldNavigateBack) {
      stop();
    }
  }, [shouldNavigateBack]);

  // Apply saved playback speed when initialized
  useEffect(() => {
    if (isInitialized && audioPlaybackSpeed && setRate) {
      setRate(audioPlaybackSpeed);
    }
  }, [isInitialized, audioPlaybackSpeed, setRate]);

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

        const formattedUrl = formatUrlForTrackPlayer(currentPlaying.audioUrl);

        const track = {
          id: currentPlaying.id,
          url: formattedUrl,
          title: currentPlaying.displayName,
          artist: currentPlaying.displayName,
          duration: 0,
        };

        await addAndPlayTrack(track);
      }
    } catch (error) {
      logError("Error in handlePlayPause:", error);
      showErrorToast(`${STRINGS.UNABLE_TO_PLAY} ${STRINGS.PLEASE_TRY_AGAIN}`);
    }
  };

  const onCloseTrackModal = () => {
    if (isPlaying) {
      stop();
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
        const formattedUrl = formatUrlForTrackPlayer(selectedTrack.audioUrl);

        const track = {
          id: selectedTrack.id,
          url: formattedUrl,
          title: selectedTrack.displayName,
          artist: selectedTrack.displayName,
          duration: 0,
        };

        await addAndPlayTrack(track);
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
        <Text style={styles.trackTitle}>Initializing audio player...</Text>
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
  shouldNavigateBack: PropTypes.bool.isRequired,
  webViewRef: PropTypes.shape({
    current: PropTypes.shape({
      postMessage: PropTypes.func,
    }),
  }).isRequired,
};

export default AudioPlayer;
