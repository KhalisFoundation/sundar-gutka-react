import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { exists } from "react-native-fs";
import TrackPlayer from "react-native-track-player";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { AudioTrackDialog, AudioControlBar } from "./components";
import { useAudioManifest, useDownloadManager, useTrackPlayer, useAudioSyncScroll } from "./hooks";
import createStyles from "./style";
import { formatUrlForTrackPlayer, isLocalFile } from "./utils/urlHelper";

const AudioPlayer = ({ baniID, title, shouldNavigateBack, webViewRef }) => {
  const styles = useThemedStyles(createStyles);
  const [showTrackModal, setShowTrackModal] = useState(true);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const defaultAudio = useSelector((state) => state.defaultAudio);
  // Custom hooks
  const {
    tracks,
    currentPlaying,
    setCurrentPlaying,
    addTrackToManifest,
    removeTrackFromManifest,
    isTrackDownloaded,
  } = useAudioManifest(baniID);

  const { isDownloading, isDownloaded, handleDownload, handleDeleteDownload } = useDownloadManager(
    currentPlaying,
    addTrackToManifest,
    removeTrackFromManifest,
    isTrackDownloaded
  );

  const {
    isPlaying,
    progress,
    play,
    pause,
    stop,
    addAndPlayTrack,
    seekTo,
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

        // Otherwise, load the new track
        // Check if local file exists
        if (isLocalFile(currentPlaying.audioUrl)) {
          const cleanPath = currentPlaying.audioUrl.replace("file://", "");
          const fileExists = await exists(cleanPath);

          if (!fileExists) {
            console.error("❌ LOCAL FILE DOES NOT EXIST:", cleanPath);
            // You could fallback to remote URL here if needed
          } else {
            console.log("✅ Local file exists, proceeding with playback");
          }
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
      console.error("Error in handlePlayPause:", error);
    }
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
      console.error("Error seeking:", error);
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
      console.error("Error switching track:", error);
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

  if (!tracks || tracks.length === 0) {
    console.log("No tracks found for baniID:", baniID);
    return null;
  }

  return showTrackModal ? (
    <AudioTrackDialog handleTrackSelect={handleTrackSelect} title={title} tracks={tracks} />
  ) : (
    <AudioControlBar
      baniID={baniID}
      handleTrackSelect={handleTrackSelect}
      tracks={tracks}
      isPlaying={isPlaying}
      currentPlaying={currentPlaying}
      handlePlayPause={handlePlayPause}
      progress={progress}
      handleSeek={handleSeek}
      isAudioEnabled={isAudioEnabled}
      isDownloading={isDownloading}
      isDownloaded={isDownloaded}
      handleDownload={handleDownload}
      handleDeleteDownload={handleDeleteDownload}
      title={title}
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
