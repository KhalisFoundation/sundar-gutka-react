import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { View, Pressable, Animated, Platform, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "@miblanchard/react-native-slider";
import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";
import { setAudioProgress, toggleAudioSyncScroll } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import {
  MusicNoteIcon,
  SettingsIcon,
  CloseIcon,
  PlayIcon,
  PauseIcon,
  ChevronDownIcon,
} from "@common/icons";
import { STRINGS, CustomText, logError } from "@common";
import {
  useAnimation,
  useDownloadManager,
  useBookmarks,
  useArtistListeningDuration,
} from "../../hooks";
import { audioControlBarStyles } from "../../style";
import checkLyricsFileAvailable from "../../utils/checkLRC";
import {
  getSequenceFromPosition,
  getPositionFromSequence,
} from "../../utils/getSequenceFromPosition";
import ActionComponents from "../ActionComponent";
import AudioSettingsModal from "../AudioSettingsModal";
import DownloadBadge from "../DownloadBadge";
import ScrollViewComponent from "../ScrollViewComponent";

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
  tracks,
  seekTo,
  reset,
  pause,
  setRate,
  isInitialized,
  addAndPlayTrack,
  play,
  isBufferingOrLoading,
}) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const styles = useThemedStyles(audioControlBarStyles);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMoreTracksModalOpen, setIsMoreTracksModalOpen] = useState(false);
  const [isLyricsAvailable, setIsLyricsAvailable] = useState(false);
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const progressRef = useRef(progress);
  const currentPlayingRef = useRef(currentPlaying);
  const audioProgress = useSelector((state) => state.audioProgress);
  const [isSeekLoading, setIsSeekLoading] = useState(() => {
    return !!(isInitialized && currentPlaying?.id && currentPlaying?.audioUrl);
  });
  const [isSliding, setIsSliding] = useState(false);
  const [sliderValue, setSliderValue] = useState(progress.position);
  const isSeekingRef = useRef(false);
  const { modalHeight, modalOpacity } = useAnimation(isSettingsModalOpen, isMoreTracksModalOpen);
  const { isDownloading, isDownloaded } = useDownloadManager(
    currentPlaying,
    addTrackToManifest,
    isTrackDownloaded
  );
  useBookmarks(seekTo, currentPlaying?.lyricsUrl);
  useArtistListeningDuration(baniID, isPlaying, currentPlaying);
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

  useEffect(() => {
    if (currentPlaying?.id) {
      setIsSeekLoading(true); // start loading immediately on track change
    } else {
      setIsSeekLoading(false);
    }
    setSliderValue(0);
  }, [currentPlaying?.id]);

  // Clear loading once TrackPlayer reports duration and buffering is done
  useEffect(() => {
    if (
      currentPlaying?.id &&
      progress.duration > 0 &&
      !isBufferingOrLoading &&
      !isSeekingRef.current
    ) {
      setIsSeekLoading(false);
    }
  }, [currentPlaying?.id, progress.duration, isBufferingOrLoading]);

  // Sync slider value with progress when not sliding and not seeking (and not loading)
  useEffect(() => {
    if (!isSliding && !isSeekingRef.current && !isSeekLoading) {
      setSliderValue(progress.position);
    }
  }, [progress.position, isSliding, isSeekLoading]);

  // Save progress when user closes the modal
  const handleClose = async () => {
    const currentProgress = progressRef.current;
    const currentTrack = currentPlayingRef.current;

    if (currentTrack?.id && currentProgress?.position != null) {
      // Save sequence along with position
      let sequence = null;
      if (currentTrack?.lyricsUrl) {
        sequence = await getSequenceFromPosition(currentTrack.lyricsUrl, currentProgress.position);
      }
      dispatch(setAudioProgress(baniID, currentTrack.id, currentProgress.position, sequence));
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

  const actionItems =
    isMoreTracksModalOpen || isSettingsModalOpen
      ? [
          {
            onPress: () => {
              setIsMoreTracksModalOpen(false);
              setIsSettingsModalOpen(false);
            },
            Icon: ChevronDownIcon,
            id: 1,
          },
        ]
      : [
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
      try {
        setIsSeekLoading(true);
        // Load the track (will seek to saved position if available)
        await addAndPlayTrack(
          currentPlaying.id,
          currentPlaying.audioUrl,
          currentPlaying.displayName,
          currentPlaying.displayName,
          currentPlaying.lyricsUrl,
          currentPlaying.trackLengthSec,
          currentPlaying.trackSizeMB,
          false,
          currentPlaying.remoteUrl || currentPlaying.audioUrl
        );

        // Check if we have saved progress for this track
        if (baniID && audioProgress?.[baniID]) {
          const savedProgress = audioProgress[baniID];

          // If we have a saved sequence, try to restore position from sequence first
          if (savedProgress.sequence != null && currentPlaying?.lyricsUrl) {
            const sequencePosition = await getPositionFromSequence(
              currentPlaying.lyricsUrl,
              savedProgress.sequence
            );
            if (sequencePosition != null) {
              await seekTo(sequencePosition);
              if (isAudioAutoPlay) {
                await play();
              }
              setIsSeekLoading(false);
              return;
            }
          }

          // Fallback to saved position if sequence not found or not available
          if (savedProgress.position && currentPlaying?.id === savedProgress.trackId) {
            await seekTo(savedProgress.position);
          }
        }

        if (isAudioAutoPlay) {
          await play();
        }
        setIsSeekLoading(false);
      } catch (error) {
        logError("Error loading active track:", error);
        setIsSeekLoading(false);
      }
    };

    if (isInitialized && currentPlaying?.id && currentPlaying?.audioUrl) {
      loadActiveTrack();
    }
  }, [isInitialized, currentPlaying?.id, currentPlaying?.audioUrl, audioProgress, baniID]);

  // Save audio progress when component unmounts or user leaves the screen
  useEffect(() => {
    return () => {
      const currentProgress = progressRef.current;
      const currentTrack = currentPlayingRef.current;
      const trackId = currentTrack?.id;
      if (trackId && currentProgress?.position != null) {
        // Save sequence along with position
        (async () => {
          let sequence = null;
          const lyricsUrl = currentTrack?.lyricsUrl;
          if (lyricsUrl) {
            sequence = await getSequenceFromPosition(lyricsUrl, currentProgress.position);
          }
          dispatch(setAudioProgress(baniID, trackId, currentProgress.position, sequence));
          await reset();
        })();
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

  // Handle slider value change during dragging (optimistic update)
  const handleSliderValueChange = useCallback(
    (value) => {
      if (isSliding) {
        setSliderValue(value[0]);
      }
    },
    [isSliding]
  );

  // Handle slider drag start
  const handleSlidingStart = useCallback(() => {
    setIsSliding(true);
  }, []);

  // Handle seek completion - non-blocking for smooth UI
  const handleSeekComplete = useCallback(
    (value) => {
      setIsSliding(false);
      // Prevent concurrent seeks
      if (isSeekingRef.current || !isAudioEnabled) {
        return;
      }

      // Update UI immediately (optimistic update)
      setSliderValue(value);

      // Perform seek operation asynchronously without blocking UI
      (async () => {
        try {
          isSeekingRef.current = true;
          setIsSeekLoading(true);
          await handleSeek(value);
        } catch (error) {
          // Error is already handled in handleSeek
          logError("Error in handleSeekComplete:", error);
        } finally {
          isSeekingRef.current = false;
          setIsSeekLoading(false);
        }
      })();
    },
    [handleSeek, isAudioEnabled]
  );

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
              <ScrollViewComponent
                tracks={tracks}
                selectedTrack={currentPlaying}
                handleSelectTrack={handleTrackSelect}
              />
            </View>
          )}
        </Animated.View>

        {/* Main Playback Section */}
        <View style={[styles.mainSection]}>
          <View style={styles.trackInfo}>
            <View style={styles.trackInfoLeft}>
              {currentPlaying && currentPlaying.displayName && (
                <CustomText style={styles.trackName}>{currentPlaying.displayName}</CustomText>
              )}
            </View>
          </View>

          <View style={styles.playbackControls}>
            {isSeekLoading || isBufferingOrLoading || !currentPlaying?.id ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Pressable style={styles.playButton} onPress={handlePlayPause}>
                {isPlaying ? (
                  <PauseIcon size={30} color={theme.colors.audioTitleText} />
                ) : (
                  <PlayIcon size={30} color={theme.colors.audioTitleText} />
                )}
              </Pressable>
            )}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <CustomText style={[styles.timestamp, styles.timestampWithColor]}>
                  {formatTime(sliderValue)}
                </CustomText>
                <Slider
                  value={sliderValue}
                  minimumValue={0}
                  maximumValue={progress.duration}
                  onSlidingStart={handleSlidingStart}
                  onValueChange={handleSliderValueChange}
                  onSlidingComplete={([v]) => handleSeekComplete(v)}
                  minimumTrackTintColor={sliderMinTrackColor}
                  maximumTrackTintColor={theme.staticColors.SLIDER_TRACK_COLOR}
                  disabled={!isAudioEnabled || isSeekLoading}
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
    remoteUrl: PropTypes.string,
  }),
  addTrackToManifest: PropTypes.func.isRequired,
  isTrackDownloaded: PropTypes.func.isRequired,
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
  play: PropTypes.func.isRequired,
  isBufferingOrLoading: PropTypes.bool.isRequired,
};

export default AudioControlBar;
