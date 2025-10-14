import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Animated, StyleSheet, Platform } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Slider } from "@miblanchard/react-native-slider";
import { BlurView } from "@react-native-community/blur";
import PropTypes from "prop-types";
import { toggleAudio } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import {
  MusicNoteIcon,
  SettingsIcon,
  ExpandCollapseIcon,
  CloseIcon,
  PlayIcon,
  PauseIcon,
} from "@common/icons";
import { STRINGS } from "@common";
import { useTrackPlayer, useAnimation } from "../hooks";
import { audioControlBarStyles } from "../style";
import ActionComponents from "./ActionComponent";
import AudioSettingsModal from "./AudioSettingsModal";
import DownloadBadge from "./DownloadBadge";
import MinimizePlayer from "./MinimizePlayer";
import ScrollViewComponent from "./ScrollViewComponent";

const AudioControlBar = ({
  baniID,
  isPlaying,
  currentPlaying,
  handlePlayPause,
  progress,
  handleSeek,
  isAudioEnabled,
  isDownloading = false,
  isDownloaded = false,
  handleDownload,
  handleTrackSelect,
  tracks,
  title,
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(audioControlBarStyles);
  const [isMinimized, setIsMinimized] = useState(false);
  const isNightMode = useSelector((state) => state.isNightMode);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMoreTracksModalOpen, setIsMoreTracksModalOpen] = useState(false);
  const { stop } = useTrackPlayer();
  const dispatch = useDispatch();
  const { modalHeight, modalOpacity, playerOpacity, minimizeOpacity } = useAnimation(
    isSettingsModalOpen,
    isMoreTracksModalOpen,
    isMinimized
  );
  const backgroundColor =
    Platform.OS === "ios" ? theme.staticColors.SEMI_TRANSPARENT : theme.staticColors.WHITE_COLOR;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate slider colors to avoid nested ternary
  const getSliderMinTrackColor = () => {
    if (!isAudioEnabled) return theme.staticColors.LIGHT_GRAY;
    return theme.colors.audioPlayer;
  };
  const actionComponents = [
    {
      selector: isMoreTracksModalOpen,
      toggle: setIsMoreTracksModalOpen,
      Icon: MusicNoteIcon,
      text: STRINGS.MORE_TRACKS,
    },
    {
      selector: isSettingsModalOpen,
      toggle: setIsSettingsModalOpen,
      Icon: SettingsIcon,
      text: STRINGS.AUDIO_SETTINGS,
    },
  ];

  const actionItems = [
    {
      onPress: () => setIsMinimized(true),
      Icon: ExpandCollapseIcon,
      id: 1,
    },
    {
      onPress: () => {
        stop();
        dispatch(toggleAudio(false));
      },
      Icon: CloseIcon,
      id: 2,
    },
  ];

  useEffect(() => {
    if (isSettingsModalOpen) {
      setIsMoreTracksModalOpen(false);
    }
  }, [isSettingsModalOpen]);

  useEffect(() => {
    if (isMoreTracksModalOpen) {
      setIsSettingsModalOpen(false);
    }
  }, [isMoreTracksModalOpen]);

  return (
    <>
      {/* Minimized Player with Animation */}
      <Animated.View
        style={[
          styles.minimizePlayerAnimation,
          { opacity: minimizeOpacity },
          isMinimized && styles.minimizePlayerAnimationActive,
        ]}
        pointerEvents={isMinimized ? "auto" : "none"}
      >
        <MinimizePlayer
          setIsMinimized={setIsMinimized}
          handlePlayPause={handlePlayPause}
          isPlaying={isPlaying}
          progress={formatTime(progress.position)}
          duration={formatTime(progress.duration)}
          displayName={currentPlaying?.displayName || ""}
        />
      </Animated.View>
      <View style={[styles.container]} pointerEvents="box-none">
        {/* Full Player with Animation */}
        <Animated.View
          style={[styles.fullPlayerAnimation, { opacity: playerOpacity }]}
          pointerEvents={isMinimized ? "none" : "auto"}
        >
          <DownloadBadge
            currentPlaying={currentPlaying}
            isDownloaded={isDownloaded}
            isDownloading={isDownloading}
            isAudioEnabled={isAudioEnabled}
            onDownload={handleDownload}
          />
          <View style={[styles.mainContainer, isNightMode && styles.mainContainerNight]}>
            {Platform.OS === "ios" && theme.mode === "light" && (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType={isNightMode ? "dark" : "light"}
                blurAmount={5}
                reducedTransparencyFallbackColor={
                  isNightMode ? theme.staticColors.NIGHT_BLACK : backgroundColor
                }
              />
            )}
            {/* Top Control Bar */}
            <View style={styles.topControlBar}>
              <View style={styles.leftControls}>
                {actionComponents.map((component) => (
                  <ActionComponents
                    key={component.text}
                    selector={component.selector}
                    toggle={component.toggle}
                    Icon={component.Icon}
                    text={component.text}
                  />
                ))}
              </View>

              <View style={styles.rightControls}>
                {actionItems.map((item) => (
                  <Pressable key={item.id} style={styles.controlIcon} onPress={item.onPress}>
                    <item.Icon size={30} color={theme.colors.audioTitleText} />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Separator */}
            <View style={styles.separator} />
            <Animated.View
              style={[styles.modalAnimation, { height: modalHeight, opacity: modalOpacity }]}
            >
              {isSettingsModalOpen && (
                <AudioSettingsModal title={title} tracks={tracks} baniID={baniID} />
              )}

              {isMoreTracksModalOpen && (
                <View style={styles.moreTracksModalContainer}>
                  <ScrollViewComponent
                    tracks={tracks}
                    selectedTrack={currentPlaying}
                    handleSelectTrack={handleTrackSelect}
                  />
                </View>
              )}
            </Animated.View>

            {/* Main Playback Section */}
            <View style={[styles.mainSection, styles.mainSectionWithBorder]}>
              <View style={styles.trackInfo}>
                <View style={styles.trackInfoLeft}>
                  {currentPlaying && currentPlaying.displayName && (
                    <Text style={styles.trackName}>{currentPlaying.displayName}</Text>
                  )}
                </View>
              </View>

              <View style={styles.playbackControls}>
                <Pressable style={styles.playButton} onPress={handlePlayPause}>
                  {isPlaying ? (
                    <PauseIcon size={30} color={theme.colors.audioTitleText} />
                  ) : (
                    <PlayIcon size={30} color={theme.colors.audioTitleText} />
                  )}
                </Pressable>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <Text style={[styles.timestamp, styles.timestampWithColor]}>
                      {formatTime(progress.position)}
                    </Text>
                    <Slider
                      value={progress.position}
                      minimumValue={0}
                      maximumValue={progress.duration}
                      onSlidingComplete={([v]) => handleSeek(v)}
                      minimumTrackTintColor={getSliderMinTrackColor()}
                      maximumTrackTintColor={theme.colors.surfaceGrey}
                      disabled={!isAudioEnabled}
                      trackStyle={{
                        height: 6,
                        borderRadius: 3,
                      }}
                      thumbStyle={{
                        width: 10,
                        height: 10,
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </>
  );
};

AudioControlBar.propTypes = {
  currentPlaying: PropTypes.shape().isRequired,
  isPlaying: PropTypes.bool.isRequired,
  handlePlayPause: PropTypes.func.isRequired,
  progress: PropTypes.shape({
    position: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
  }).isRequired,
  handleTrackSelect: PropTypes.func.isRequired,
  tracks: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  handleSeek: PropTypes.func.isRequired,
  isAudioEnabled: PropTypes.bool.isRequired,
  isDownloading: PropTypes.bool.isRequired,
  isDownloaded: PropTypes.bool.isRequired,
  handleDownload: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  baniID: PropTypes.string.isRequired,
};

export default AudioControlBar;
