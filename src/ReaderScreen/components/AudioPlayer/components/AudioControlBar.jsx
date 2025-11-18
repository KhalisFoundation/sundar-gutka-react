import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, Pressable, Animated, Platform, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "@miblanchard/react-native-slider";
import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";
import { setAudioProgress, toggleAudioSyncScroll } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { MusicNoteIcon, SettingsIcon, CloseIcon, PlayIcon, PauseIcon } from "@common/icons";
import { STRINGS, CustomText, logError } from "@common";
import { useAnimation, useDownloadManager, useBookmarks } from "../hooks";
import { audioControlBarStyles } from "../style";
import checkLyricsFileAvailable from "../utils/checkLRC";
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
  currentPlaying,
  addTrackToManifest,
  isTrackDownloaded,
  isTracksLoading,
  tracks,
  seekTo,
  reset,
  pause,
  setRate,
  isInitialized,
  addAndPlayTrack,
}) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const styles = useThemedStyles(audioControlBarStyles);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMoreTracksModalOpen, setIsMoreTracksModalOpen] = useState(false);
  const [isLyricsAvailable, setIsLyricsAvailable] = useState(false);
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const progressRef = useRef(progress);
  const currentPlayingRef = useRef(currentPlaying);
  const audioProgress = useSelector((state) => state.audioProgress);
  const { modalHeight, modalOpacity } = useAnimation(isSettingsModalOpen, isMoreTracksModalOpen);
  const { isDownloading, isDownloaded } = useDownloadManager(
    currentPlaying,
    addTrackToManifest,
    isTrackDownloaded
  );
  useBookmarks(seekTo, currentPlaying?.lyricsUrl);
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Memoize slider color to avoid recalculating on every render
  const sliderMinTrackColor = useMemo(() => {
    if (!isAudioEnabled) return theme.staticColors.LIGHT_GRAY;
    return theme.colors.primary;
  }, [isAudioEnabled, theme.staticColors.LIGHT_GRAY, theme.colors.primary]);

  // Keep refs updated with latest values
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    currentPlayingRef.current = currentPlaying;
  }, [currentPlaying]);

  // Save progress when user closes the modal
  const handleClose = () => {
    const currentProgress = progressRef.current;
    const currentTrack = currentPlayingRef.current;

    if (currentTrack?.id && currentProgress?.position != null) {
      dispatch(setAudioProgress(baniID, currentTrack.id, currentProgress.position));
    }

    onCloseTrackModal();
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
      onPress: handleClose,
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
    const checkLyrics = async () => {
      if (currentPlaying?.lyricsUrl) {
        const isAvailable = await checkLyricsFileAvailable(currentPlaying?.lyricsUrl);
        setIsLyricsAvailable(isAvailable);
        // If sync scroll is enabled, toggle it based on the availability of the lyrics file
        if (isAudioSyncScroll) {
          dispatch(toggleAudioSyncScroll(isAvailable));
        }
      }
    };
    checkLyrics();
  }, [currentPlaying?.lyricsUrl]);

  // Load the active track when component mounts or currentPlaying changes
  useEffect(() => {
    const loadActiveTrack = async () => {
      if (!isInitialized || !currentPlaying?.id || !currentPlaying?.audioUrl) {
        return;
      }

      try {
        // Load the track (will seek to saved position if available)
        await addAndPlayTrack(
          currentPlaying.id,
          currentPlaying.audioUrl,
          currentPlaying.displayName,
          currentPlaying.displayName,
          currentPlaying.lyricsUrl,
          currentPlaying.trackLengthSec,
          currentPlaying.trackSizeMB,
          false
        );
        if (
          baniID &&
          audioProgress?.[baniID]?.position &&
          currentPlaying?.id === audioProgress?.[baniID]?.trackId
        ) {
          await seekTo(audioProgress?.[baniID]?.position);
        }
      } catch (error) {
        logError("Error loading active track:", error);
      }
    };

    loadActiveTrack();
  }, [
    isInitialized,
    currentPlaying?.id,
    currentPlaying?.audioUrl,
    currentPlaying?.displayName,
    audioProgress,
    baniID,
  ]);

  // Save audio progress when component unmounts or user leaves the screen
  useEffect(() => {
    return () => {
      const currentProgress = progressRef.current;
      const currentTrack = currentPlayingRef.current;
      if (currentTrack?.id && currentProgress?.position != null) {
        dispatch(setAudioProgress(baniID, currentTrack.id, currentProgress.position));
        reset();
      }
    };
  }, [baniID]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      // This runs whenever you leave the Read screen
      (async () => {
        await pause();
      })();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {isDownloading && !isDownloaded && <DownloadBadge />}
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
          {isSettingsModalOpen && (
            <AudioSettingsModal isLyricsAvailable={isLyricsAvailable} setRate={setRate} />
          )}

          {isMoreTracksModalOpen && (
            <View style={styles.moreTracksModalContainer}>
              {isTracksLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : (
                <ScrollViewComponent
                  tracks={tracks}
                  selectedTrack={currentPlaying}
                  handleSelectTrack={handleTrackSelect}
                />
              )}
            </View>
          )}
        </Animated.View>

        {/* Main Playback Section */}
        <View style={[styles.mainSection]}>
          <View style={styles.trackInfo}>
            <View style={styles.trackInfoLeft}>
              {isTracksLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : (
                currentPlaying &&
                currentPlaying.displayName && (
                  <CustomText style={styles.trackName}>{currentPlaying.displayName}</CustomText>
                )
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
                <CustomText style={[styles.timestamp, styles.timestampWithColor]}>
                  {formatTime(progress.position)}
                </CustomText>
                <Slider
                  value={progress.position}
                  minimumValue={0}
                  maximumValue={progress.duration}
                  onSlidingComplete={([v]) => handleSeek(v)}
                  minimumTrackTintColor={sliderMinTrackColor}
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

AudioControlBar.defaultProps = {
  currentPlaying: null,
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
  currentPlaying: PropTypes.shape({
    id: PropTypes.string,
    displayName: PropTypes.string,
    audioUrl: PropTypes.string,
    lyricsUrl: PropTypes.string,
    trackLengthSec: PropTypes.number,
    trackSizeMB: PropTypes.number,
  }),
  addTrackToManifest: PropTypes.func.isRequired,
  isTrackDownloaded: PropTypes.func.isRequired,
  isTracksLoading: PropTypes.bool.isRequired,
  tracks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      displayName: PropTypes.string.isRequired,
    })
  ).isRequired,
  seekTo: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  pause: PropTypes.func.isRequired,
  setRate: PropTypes.func.isRequired,
  isInitialized: PropTypes.bool.isRequired,
  addAndPlayTrack: PropTypes.func.isRequired,
};

export default AudioControlBar;
