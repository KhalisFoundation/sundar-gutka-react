import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import PropTypes from "prop-types";
import { Slider } from "@miblanchard/react-native-slider";
import { colors, STRINGS } from "@common";
import { useSelector, useDispatch } from "react-redux";
import {
  MusicNoteIcon,
  SettingsIcon,
  ExpandCollapseIcon,
  PlayIcon,
  CloseIcon,
} from "@common/icons";
import { BlurView } from "@react-native-community/blur";
import { toggleAudio } from "@common/actions";
import { useTrackPlayer, useAnimation } from "../hooks";
import MinimizePlayer from "./MinimizePlayer";
import DownloadBadge from "./DownloadBadge";
import { audioControlBarStyles as styles } from "../style";
import AudioTrackDialog from "./AudioTrackDialog";
import AudioSettingsModal from "./AudioSettingsModal";
import ActionComponents from "./ActionComponent";

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
  handleDeleteDownload,
  handleTrackSelect,
  tracks,
  title,
}) => {
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
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
    <View style={[styles.container]}>
      {/* Minimized Player with Animation */}
      <Animated.View
        style={{
          opacity: minimizeOpacity,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: isMinimized ? 1 : 0,
        }}
        pointerEvents={isMinimized ? "auto" : "none"}
      >
        <MinimizePlayer
          setIsMinimized={setIsMinimized}
          handlePlayPause={handlePlayPause}
          isPlaying={isPlaying}
          progress={formatTime(progress.position)}
          duration={formatTime(progress.duration)}
          displayName={currentPlaying.displayName}
        />
      </Animated.View>

      {/* Full Player with Animation */}
      <Animated.View
        style={{
          opacity: playerOpacity,
        }}
        pointerEvents={isMinimized ? "none" : "auto"}
      >
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
                  <item.Icon
                    size={25}
                    color={
                      isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR
                    }
                  />
                </Pressable>
              ))}
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
          <Animated.View
            style={{
              height: modalHeight,
              opacity: modalOpacity,
              overflow: "hidden",
            }}
          >
            {isSettingsModalOpen && (
              <AudioSettingsModal title={title} tracks={tracks} baniID={baniID} />
            )}

            {isMoreTracksModalOpen && (
              <AudioTrackDialog
                handleTrackSelect={handleTrackSelect}
                tracks={tracks}
                isHeader={false}
                isFooter={false}
              />
            )}
          </Animated.View>

          {/* Main Playback Section */}
          <View style={styles.mainSection}>
            <View style={styles.trackInfo}>
              <View style={styles.trackInfoLeft}>
                {currentPlaying && currentPlaying.displayName && (
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
                )}
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
                    color: isNightMode
                      ? colors.AUDIO_PLAYER_NIGHT_ICON
                      : colors.READER_HEADER_COLOR,
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
                    color={
                      isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR
                    }
                  />
                ) : (
                  <PlayIcon
                    size={30}
                    color={
                      isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR
                    }
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
      </Animated.View>
    </View>
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
  handleDeleteDownload: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  baniID: PropTypes.number.isRequired,
};

export default AudioControlBar;
