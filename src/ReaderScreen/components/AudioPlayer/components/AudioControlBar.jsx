import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import PropTypes from "prop-types";
import Slider from "@react-native-community/slider";
import { colors } from "@common";
import { MusicNoteIcon, SettingsIcon, ExpandCollapseIcon, PlayIcon } from "@common/icons";
import MinimizePlayer from "./MinimizePlayer";
import DownloadBadge from "./DownloadBadge";
import { audioControlBarStyles as styles } from "../style";

const AudioControlBar = ({
  isPlaying,
  currentPlaying,
  handlePlayPause,
  progress,
  setShowTrackModal,
  handleSeek,
  isAudioEnabled,
  isDownloading = false,
  isDownloaded = false,
  handleDownload,
  handleDeleteDownload,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

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
      duration={formatTime(progress.duration)}
      displayName={currentPlaying.displayName}
    />
  ) : (
    <View style={styles.container}>
      <DownloadBadge
        currentPlaying={currentPlaying}
        isDownloaded={isDownloaded}
        isDownloading={isDownloading}
        isAudioEnabled={isAudioEnabled}
        onDownload={handleDownload}
        onDelete={handleDeleteDownload}
      />
      <View style={styles.mainContainer}>
        {/* Top Control Bar */}
        <View style={styles.topControlBar}>
          <View style={styles.leftControls}>
            <Pressable style={styles.actionButton} onPress={() => setShowTrackModal(true)}>
              <MusicNoteIcon size={25} color={colors.READER_HEADER_COLOR} />
              <Text style={styles.actionButtonText}>More Tracks</Text>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <SettingsIcon size={30} color={colors.READER_HEADER_COLOR} />
              <Text style={styles.actionButtonText}>Audio Settings</Text>
            </Pressable>
          </View>

          <View style={styles.rightControls}>
            <Pressable style={styles.controlIcon} onPress={() => setIsMinimized(true)}>
              <ExpandCollapseIcon size={30} color={colors.READER_HEADER_COLOR} />
            </Pressable>
          </View>
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Main Playback Section */}
        <View style={styles.mainSection}>
          <View style={styles.trackInfo}>
            <Text style={styles.trackName}>{currentPlaying.displayName}</Text>
            <Text style={styles.timestamp}>
              {formatTime(progress.position)}/{formatTime(progress.duration)}
            </Text>
          </View>

          <View style={styles.playbackControls}>
            <Pressable style={styles.playButton} onPress={handlePlayPause}>
              {isPlaying ? (
                <Icon name="pause" size={30} color={colors.READER_HEADER_COLOR} />
              ) : (
                <PlayIcon width={30} height={30} iconColor={colors.READER_HEADER_COLOR} />
              )}
            </Pressable>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={progress.duration}
                  value={progress.position}
                  onSlidingComplete={handleSeek}
                  minimumTrackTintColor={isAudioEnabled ? "#113979" : "#ccc"}
                  maximumTrackTintColor="#d3d3d3"
                  thumbTintColor={isAudioEnabled ? "#113979" : "#ccc"}
                  disabled={!isAudioEnabled}
                />
              </View>
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
  isDownloading: PropTypes.bool.isRequired,
  isDownloaded: PropTypes.bool.isRequired,
  handleDownload: PropTypes.func.isRequired,
  handleDeleteDownload: PropTypes.func.isRequired,
};

export default AudioControlBar;
