import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import Slider from "@react-native-community/slider";
import PropTypes from "prop-types";
import { exists } from "react-native-fs";
import { useAudioManifest, useDownloadManager, useTrackPlayer } from "./hooks";
import { TrackSelector, DownloadControls } from "./components";
import { formatUrlForTrackPlayer, isLocalFile } from "./utils/urlHelper";
import styles from "./style";

const AudioPlayer = ({ baniID, title, shouldNavigateBack }) => {
  const [showTrackModal, setShowTrackModal] = useState(false);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);

  // Custom hooks
  const {
    tracks,
    currentPlaying,
    setCurrentPlaying,
    isLoading: manifestLoading,
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

  const handleStop = async () => {
    if (!isAudioEnabled || !isInitialized) return;
    try {
      await stop();
    } catch (error) {
      console.error("Error stopping:", error);
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
    <View style={styles.container}>
      <View style={styles.trackInfo}>
        <Text style={styles.artistName}>{title}</Text>
        {currentPlaying && (
          <TouchableOpacity
            onPress={() => setShowTrackModal(true)}
            style={styles.artistNameContainer}
          >
            <Text style={styles.artistName}>{currentPlaying.displayName}</Text>

            <Icon name="expand-more" size={16} color="#666" />
          </TouchableOpacity>
        )}
        {!isAudioEnabled && (
          <Text style={styles.disabledText}>
            Audio is disabled. Enable it in Settings to play audio.
          </Text>
        )}
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={progress.duration}
          value={progress.position}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor={isAudioEnabled ? "#1976d2" : "#ccc"}
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor={isAudioEnabled ? "#1976d2" : "#ccc"}
          disabled={!isAudioEnabled || manifestLoading}
        />
        <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
      </View>

      {/* Download Controls */}
      <DownloadControls
        currentPlaying={currentPlaying}
        isDownloaded={isDownloaded}
        isDownloading={isDownloading}
        isAudioEnabled={isAudioEnabled}
        onDownload={handleDownload}
        onDelete={handleDeleteDownload}
      />

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={handleStop}
          style={styles.controlButton}
          disabled={!isAudioEnabled || manifestLoading}
        >
          <Icon name="stop" size={30} color={isAudioEnabled ? "#000" : "#ccc"} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          style={[
            isAudioEnabled ? styles.playButton : styles.disabledButton,
            { opacity: manifestLoading ? 0.5 : 0.7 },
          ]}
          disabled={!isAudioEnabled || manifestLoading}
        >
          <Icon
            name={isPlaying ? "pause" : "play-arrow"}
            size={40}
            color={isAudioEnabled ? "#000" : "#ccc"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          disabled={!isAudioEnabled || manifestLoading}
        >
          <Icon name="skip-next" size={30} color={isAudioEnabled ? "#000" : "#ccc"} />
        </TouchableOpacity>
      </View>

      {/* Track Selection Modal */}
      <TrackSelector
        visible={showTrackModal}
        onClose={() => setShowTrackModal(false)}
        tracks={tracks}
        currentPlaying={currentPlaying}
        onTrackSelect={handleTrackSelect}
        isLoading={manifestLoading}
      />
    </View>
  );
};

AudioPlayer.propTypes = {
  baniID: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  shouldNavigateBack: PropTypes.bool.isRequired,
};

export default AudioPlayer;
