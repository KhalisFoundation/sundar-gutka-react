import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Animated, Platform } from "react-native";
import { Slider } from "@miblanchard/react-native-slider";
import { BlurView } from "@react-native-community/blur";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { MusicNoteIcon, SettingsIcon, CloseIcon, PlayIcon, PauseIcon } from "@common/icons";
import { STRINGS } from "@common";
import { useAnimation, useDownloadManager, useAudioManifest } from "../hooks";
import { audioControlBarStyles } from "../style";
import ActionComponents from "./ActionComponent";
import AudioSettingsModal from "./AudioSettingsModal";
import DownloadBadge from "./DownloadBadge";
import ScrollViewComponent from "./ScrollViewComponent";

const AudioControlBar = ({
  isPlaying,
  handlePlayPause,
  progress,
  handleSeek,
  isAudioEnabled,
  handleTrackSelect,
  onCloseTrackModal,
  baniID,
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(audioControlBarStyles);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMoreTracksModalOpen, setIsMoreTracksModalOpen] = useState(false);
  const { modalHeight, modalOpacity } = useAnimation(isSettingsModalOpen, isMoreTracksModalOpen);
  const { tracks, currentPlaying, addTrackToManifest, removeTrackFromManifest, isTrackDownloaded } =
    useAudioManifest(baniID);
  const { isDownloading, isDownloaded, handleDownload } = useDownloadManager(
    currentPlaying,
    addTrackToManifest,
    removeTrackFromManifest,
    isTrackDownloaded
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate slider colors to avoid nested ternary
  const getSliderMinTrackColor = () => {
    if (!isAudioEnabled) return theme.staticColors.LIGHT_GRAY;
    return theme.colors.primary;
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
      onPress: () => {
        onCloseTrackModal();
      },
      Icon: CloseIcon,
      id: 1,
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

  useEffect(() => {
    const autoDownload = async () => {
      if (currentPlaying && !isDownloaded) {
        await handleDownload();
      }
    };
    autoDownload();
  }, [currentPlaying?.audioUrl]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {isDownloading && <DownloadBadge />}
      {/* Full Player with Animation */}
      <View style={[styles.mainContainer, Platform.OS === "ios" && styles.mainContainerIOS]}>
        {Platform.OS === "ios" && (
          <BlurView
            style={styles.blurOverlay}
            blurType={theme.mode === "dark" ? "dark" : "light"}
            blurAmount={5}
            reducedTransparencyFallbackColor={theme.colors.transparentOverlay}
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
          {isSettingsModalOpen && <AudioSettingsModal />}

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
                  maximumTrackTintColor={theme.staticColors.SLIDER_TRACK_COLOR}
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
    </View>
  );
};

AudioControlBar.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  handlePlayPause: PropTypes.func.isRequired,
  progress: PropTypes.shape({
    position: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
  }).isRequired,
  handleTrackSelect: PropTypes.func.isRequired,
  handleSeek: PropTypes.func.isRequired,
  isAudioEnabled: PropTypes.bool.isRequired,
  onCloseTrackModal: PropTypes.func.isRequired,
  baniID: PropTypes.string.isRequired,
};

export default AudioControlBar;
