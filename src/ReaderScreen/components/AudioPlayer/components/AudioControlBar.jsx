import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import PropTypes from "prop-types";
import { Slider } from "@miblanchard/react-native-slider";
import { colors, STRINGS } from "@common";
import { useSelector } from "react-redux";
import { MusicNoteIcon, SettingsIcon, ExpandCollapseIcon, PlayIcon } from "@common/icons";
import { BlurView } from "@react-native-community/blur";
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
  const isNightMode = useSelector((state) => state.isNightMode);

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
    <View style={[styles.container]}>
      <DownloadBadge
        currentPlaying={currentPlaying}
        isDownloaded={isDownloaded}
        isDownloading={isDownloading}
        isAudioEnabled={isAudioEnabled}
        onDownload={handleDownload}
        onDelete={handleDeleteDownload}
      />
      <View
        style={[
          styles.mainContainer,
          { backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.SEMI_TRANSPARENT },
        ]}
      >
        <BlurView
          style={styles.blurOverlay}
          blurType={isNightMode ? "dark" : "light"}
          blurAmount={5}
          reducedTransparencyFallbackColor={isNightMode ? colors.BLACK_COLOR : colors.WHITE_COLOR}
        />
        {/* Top Control Bar */}
        <View style={styles.topControlBar}>
          <View style={styles.leftControls}>
            <Pressable
              style={[
                styles.actionButton,
                {
                  backgroundColor: isNightMode
                    ? colors.ACTION_BUTTON_NIGHT_MODE
                    : colors.ACTION_BUTTON_COLOR,
                },
              ]}
              onPress={() => setShowTrackModal(true)}
            >
              <MusicNoteIcon
                size={25}
                color={isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  {
                    color: isNightMode
                      ? colors.AUDIO_PLAYER_NIGHT_ICON
                      : colors.READER_HEADER_COLOR,
                  },
                ]}
              >
                {STRINGS.MORE_TRACKS}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionButton,
                {
                  backgroundColor: isNightMode
                    ? colors.ACTION_BUTTON_NIGHT_MODE
                    : colors.ACTION_BUTTON_COLOR,
                },
              ]}
            >
              <SettingsIcon
                size={25}
                color={isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  {
                    color: isNightMode
                      ? colors.AUDIO_PLAYER_NIGHT_ICON
                      : colors.READER_HEADER_COLOR,
                  },
                ]}
              >
                {STRINGS.AUDIO_SETTINGS}
              </Text>
            </Pressable>
          </View>

          <View style={styles.rightControls}>
            <Pressable style={styles.controlIcon} onPress={() => setIsMinimized(true)}>
              <ExpandCollapseIcon
                size={25}
                color={isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR}
              />
            </Pressable>
          </View>
        </View>

        {/* Separator */}
        <View
          style={[
            styles.separator,
            {
              backgroundColor: isNightMode
                ? colors.AUDIO_PLAYER_NIGHT_ICON
                : colors.READER_HEADER_COLOR_10,
            },
          ]}
        />

        {/* Main Playback Section */}
        <View style={styles.mainSection}>
          <View style={styles.trackInfo}>
            <View style={styles.trackInfoLeft}>
              <Text
                style={[
                  styles.trackName,
                  {
                    color: isNightMode
                      ? colors.AUDIO_PLAYER_NIGHT_ICON
                      : colors.READER_HEADER_COLOR,
                  },
                ]}
              >
                {currentPlaying.displayName}
              </Text>
              <Text
                style={[
                  styles.trackInfoText,
                  {
                    color: isNightMode
                      ? colors.AUDIO_PLAYER_NIGHT_ICON
                      : colors.READER_HEADER_COLOR,
                  },
                ]}
              >
                ({STRINGS.info})
              </Text>
            </View>
            <Text
              style={[
                styles.timestamp,
                {
                  color: isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR,
                },
              ]}
            >
              {formatTime(progress.position)}/{formatTime(progress.duration)}
            </Text>
          </View>

          <View style={styles.playbackControls}>
            <Pressable style={styles.playButton} onPress={handlePlayPause}>
              {isPlaying ? (
                <Icon
                  name="pause"
                  size={30}
                  color={isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR}
                />
              ) : (
                <PlayIcon
                  size={30}
                  color={isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR}
                />
              )}
            </Pressable>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Slider
                  value={progress.position}
                  minimumValue={0}
                  maximumValue={progress.duration}
                  onSlidingComplete={([v]) => handleSeek(v)}
                  minimumTrackTintColor={
                    isAudioEnabled ? colors.READER_HEADER_COLOR : colors.LIGHT_GRAY
                  }
                  maximumTrackTintColor="#d3d3d3"
                  disabled={!isAudioEnabled}
                  trackStyle={{ height: 3 }}
                  thumbStyle={{ width: 2, height: 2, borderRadius: 10 }}
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
