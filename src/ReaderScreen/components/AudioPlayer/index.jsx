import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Icon } from "@rneui/themed";
import Slider from "@react-native-community/slider";
import PropTypes from "prop-types";
import fetchManifest from "@service";
import useTrackPlayer from "../../../common/hooks/useTrackPlayer";
import styles from "./style";

const AudioPlayer = ({ baniID }) => {
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
  const [tracks, setTracks] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);

  const fetchAudioManifest = async () => {
    try {
      // if (tracks !== null) {
      //   return;
      // }
      const manifest = await fetchManifest(baniID);
      console.log("Manifest received:", manifest);

      const mappedData = manifest.data.map((item) => {
        return {
          id: item.artist_id,
          audioBaseUrl: `${item.base_audio_url}${baniID}.mp3`,
          qualityLevel: parseInt(item.quality_levels, 10),
          displayName: item.displayName,
        };
      });

      console.log("Mapped data:", mappedData);
      setTracks(mappedData);

      setCurrentPlaying(mappedData[0]);
    } catch (error) {
      console.error("Error fetching manifest:", error);
    }
  };

  useEffect(() => {
    if (baniID) {
      console.log("fetching audio manifest for baniID:", baniID);
      fetchAudioManifest();
    }
  }, [baniID]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log("AudioPlayer state:", {
      isPlaying,
      isAudioEnabled,
      isInitialized,
      currentPlaying: currentPlaying
        ? {
            id: currentPlaying.id,
            displayName: currentPlaying.displayName,
            audioBaseUrl: currentPlaying.audioBaseUrl,
          }
        : null,
      tracksCount: tracks ? tracks.length : 0,
      progress: {
        position: progress.position,
        duration: progress.duration,
        buffered: progress.buffered,
      },
    });
  }, [isPlaying, isAudioEnabled, isInitialized, currentPlaying, tracks, progress]);

  const handlePlayPause = async () => {
    // Check if TrackPlayer is initialized
    if (!isInitialized) {
      console.log("TrackPlayer not initialized yet");
      return;
    }

    if (!isAudioEnabled) {
      console.log("Audio is disabled");
      return;
    }

    if (!currentPlaying) {
      console.log("No track selected");
      return;
    }

    try {
      setIsLoading(true);

      if (isPlaying) {
        console.log("Pausing audio");
        await pause();
      } else {
        console.log("Playing audio:", currentPlaying.audioBaseUrl);
        console.log("Track details:", {
          id: baniID,
          url: currentPlaying.audioBaseUrl,
          title: currentPlaying.displayName,
          artist: currentPlaying.displayName,
        });

        // Add track if not playing
        const track = {
          id: baniID,
          url: currentPlaying.audioBaseUrl,
          title: currentPlaying.displayName,
          artist: currentPlaying.displayName,
          duration: 0, // Will be updated by the player
        };

        console.log("Adding track to player:", track);
        await addAndPlayTrack(track);
        console.log("Track added and play command sent");
      }
    } catch (error) {
      console.error("Error in handlePlayPause:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeek = async (value) => {
    if (!isAudioEnabled || !isInitialized) {
      return;
    }
    try {
      await seekTo(value);
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  const handleStop = async () => {
    if (!isAudioEnabled || !isInitialized) {
      return;
    }
    try {
      await stop();
    } catch (error) {
      console.error("Error stopping:", error);
    }
  };

  const handleTrackSelect = async (selectedTrack) => {
    try {
      setIsLoading(true);

      // Stop current playback
      await stop();

      // Set the new track as current
      setCurrentPlaying(selectedTrack);

      // Close the modal
      setShowTrackModal(false);

      // Auto-play the new track if audio is enabled
      if (isAudioEnabled) {
        const track = {
          id: selectedTrack.artistID,
          url: selectedTrack.audioBaseUrl,
          title: selectedTrack.displayName,
          artist: selectedTrack.displayName,
          duration: 0,
        };

        console.log("Switching to track:", track);
        await addAndPlayTrack(track);
      }
    } catch (error) {
      console.error("Error switching track:", error);
    } finally {
      setIsLoading(false);
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

  return (
    <View style={styles.container}>
      <View style={styles.trackInfo}>
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
          disabled={!isAudioEnabled || isLoading}
        />
        <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={handleStop}
          style={styles.controlButton}
          disabled={!isAudioEnabled || isLoading}
        >
          <Icon name="stop" size={30} color={isAudioEnabled ? "#000" : "#ccc"} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          style={[
            isAudioEnabled ? styles.playButton : styles.disabledButton,
            { opacity: isLoading ? 0.5 : 0.7 },
          ]}
          disabled={!isAudioEnabled || isLoading}
        >
          <Icon
            name={isPlaying ? "pause" : "play-arrow"}
            size={40}
            color={isAudioEnabled ? "#000" : "#ccc"}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} disabled={!isAudioEnabled || isLoading}>
          <Icon name="skip-next" size={30} color={isAudioEnabled ? "#000" : "#ccc"} />
        </TouchableOpacity>
      </View>

      {/* Track Selection Modal */}
      <Modal
        visible={showTrackModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTrackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Track</Text>
              <TouchableOpacity onPress={() => setShowTrackModal(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.trackList}>
              {tracks && tracks.length > 0 ? (
                tracks.map((track) => (
                  <TouchableOpacity
                    key={track.id}
                    style={[
                      styles.trackItem,
                      currentPlaying?.id === track.id && styles.selectedTrackItem,
                    ]}
                    onPress={() => handleTrackSelect(track)}
                    disabled={isLoading}
                  >
                    <View style={styles.trackItemContent}>
                      <Text style={styles.trackItemTitle}>{track.displayName}</Text>
                      <Text style={styles.trackItemQuality}>Quality: {track.qualityLevel}</Text>
                      {currentPlaying?.id === track.id && (
                        <Icon name="check-circle" size={20} color="#1976d2" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noTracksText}>No tracks available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

AudioPlayer.propTypes = {
  baniID: PropTypes.string.isRequired,
};

export default AudioPlayer;
