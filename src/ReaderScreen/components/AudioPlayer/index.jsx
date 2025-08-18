import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { exists } from "react-native-fs";
import { BlurView } from "@react-native-community/blur";
import { useAudioManifest, useDownloadManager, useTrackPlayer } from "./hooks";
import { AudioTrackDialog, AudioControlBar } from "./components";
import { formatUrlForTrackPlayer, isLocalFile } from "./utils/urlHelper";
import styles from "./style";

const AudioPlayer = ({ baniID, title, shouldNavigateBack }) => {
  const [showTrackModal, setShowTrackModal] = useState(true);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);

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
    pause,
    stop,
    addAndPlayTrack,
    seekTo,
    isAudioEnabled,
    isInitialized,
  } = useTrackPlayer();

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
      handlePlayPause();
    }
  }, [isAudioAutoPlay, currentPlaying]);

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

      console.log("selectedTrack", selectedTrack);
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
    return null;
  }

  return (
    <View style={styles.mainContainer}>
      <BlurView
        style={styles.blurOverlay}
        blurType="light"
        blurAmount={5}
        reducedTransparencyFallbackColor="#ffffff"
      />
      {showTrackModal ? (
        <AudioTrackDialog handleTrackSelect={handleTrackSelect} title={title} tracks={tracks} />
      ) : (
        <AudioControlBar
          isPlaying={isPlaying}
          currentPlaying={currentPlaying}
          handlePlayPause={handlePlayPause}
          progress={progress}
          setShowTrackModal={setShowTrackModal}
          handleSeek={handleSeek}
          isAudioEnabled={isAudioEnabled}
          isDownloading={isDownloading}
          isDownloaded={isDownloaded}
          handleDownload={handleDownload}
          handleDeleteDownload={handleDeleteDownload}
        />
      )}
    </View>
  );
};

AudioPlayer.propTypes = {
  baniID: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  shouldNavigateBack: PropTypes.bool.isRequired,
};

export default AudioPlayer;
