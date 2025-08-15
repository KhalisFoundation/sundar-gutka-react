import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import PropTypes from "prop-types";
import Slider from "@react-native-community/slider";
import { colors } from "@common";
import { MusicNoteIcon, SettingsIcon, ExpandCollapseIcon } from "@common/icons";
import MinimizePlayer from "./MinimizePlayer";

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE_COLOR,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.SHADOW_COLOR || "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  topControlBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  leftControls: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E8F5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  actionButtonText: {
    color: colors.READER_HEADER_COLOR,
    fontSize: 14,
    fontWeight: "500",
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  controlIcon: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E5E4",
    marginBottom: 16,
  },
  mainSection: {
    flexDirection: "column",
  },

  trackName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.READER_HEADER_COLOR,
    marginBottom: 4,
  },
  infoTag: {
    fontSize: 12,
    color: "#808FAD",
    fontStyle: "italic",
  },
  playbackControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  playButton: {
    backgroundColor: colors.READER_HEADER_COLOR,
    borderRadius: 20,
    padding: 12,
  },
  progressContainer: {
    flex: 1,
  },

  timestamp: {
    fontSize: 14,
    color: colors.READER_HEADER_COLOR,
    fontWeight: "500",
    minWidth: 40,
    textAlign: "right",
  },
});

const AudioControlBar = ({
  isPlaying,
  currentPlaying,
  handlePlayPause,
  progress,
  setShowTrackModal,
  handleSeek,
  isAudioEnabled,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  console.log(currentPlaying.displayName);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return isMinimized ? (
    <MinimizePlayer
      setIsMinimized={setIsMinimized}
      handlePlayPause={handlePlayPause}
      isPlaying={isPlaying}
      progress={formatTime(progress.position)}
      displayName={currentPlaying.displayName}
    />
  ) : (
    <View style={styles.container}>
      {/* Top Control Bar */}
      <View style={styles.topControlBar}>
        <View style={styles.leftControls}>
          <Pressable style={styles.actionButton} onPress={() => setShowTrackModal(true)}>
            <MusicNoteIcon size={16} color={colors.READER_HEADER_COLOR} />
            <Text style={styles.actionButtonText}>More Tracks</Text>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <SettingsIcon size={16} color={colors.READER_HEADER_COLOR} />
            <Text style={styles.actionButtonText}>Audio Settings</Text>
          </Pressable>
        </View>

        <View style={styles.rightControls}>
          <Pressable style={styles.controlIcon} onPress={() => setIsMinimized(true)}>
            <ExpandCollapseIcon size={20} color={colors.READER_HEADER_COLOR} />
          </Pressable>
        </View>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Main Playback Section */}
      <View style={styles.mainSection}>
        <View style={styles.trackInfo}>
          <Text style={styles.trackName}>{currentPlaying.displayName}</Text>
          <Text style={styles.infoTag}>{currentPlaying.description}</Text>
        </View>

        <View style={styles.playbackControls}>
          <Pressable style={styles.playButton} onPress={handlePlayPause}>
            <Icon name={isPlaying ? "pause" : "play-arrow"} size={20} color={colors.WHITE_COLOR} />
          </Pressable>

          <View style={styles.progressContainer}>
            <Text style={styles.timestamp}>
              {formatTime(progress.position)}/{formatTime(progress.duration)}
            </Text>
            <View style={styles.progressBar}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={progress.duration}
                value={progress.position}
                onSlidingComplete={handleSeek}
                minimumTrackTintColor={isAudioEnabled ? "#113979  " : "#ccc"}
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor={isAudioEnabled ? "#113979" : "#ccc"}
                thumbStyle={{
                  width: 12,
                  height: 12,
                  borderRadius: 12,
                }}
                disabled={!isAudioEnabled}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

AudioControlBar.propTypes = {
  currentPlaying: PropTypes.shape().isRequired,
  isPlaying: PropTypes.bool.isRequired,
  handlePlayPause: PropTypes.func.isRequired,
  progress: PropTypes.shape().isRequired,
  setShowTrackModal: PropTypes.func.isRequired,
  handleSeek: PropTypes.func.isRequired,
  isAudioEnabled: PropTypes.bool.isRequired,
};

export default AudioControlBar;
