import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { View, Pressable, Animated, Platform } from "react-native";
import TrackPlayer from "react-native-track-player";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "@miblanchard/react-native-slider";
import { BlurView } from "@react-native-community/blur";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import PropTypes from "prop-types";
import { setAudioProgress } from "@common/actions";
import { Spinner } from "@common/components/ui";
// Used by the two bani-length guards below. It was referenced without being
// imported, so those paths threw a ReferenceError instead of running.
import constant from "@common/constant";
import { useNetwork } from "@common/context";
import {
  MusicNoteIcon,
  SettingsIcon,
  CloseIcon,
  PlayIcon,
  PauseIcon,
  ChevronDownIcon,
  ExpandCollapseIcon,
} from "@common/icons";
import { handlePlayerError } from "@common/TrackPlayerUtils";
import { STRINGS, CustomText, setToastBottomReservation, trackPlayerForm } from "@common";
import {
  useAnimation,
  useDownloadManager,
  useBookmarks,
  useArtistListeningDuration,
} from "../../hooks";
import { audioControlBarStyles, MINIMIZED_PLAYER_FOOTPRINT } from "../../style";
import { useAudioTheme, useAudioThemedStyles } from "../../useAudioTheme";
import checkLyricsFileAvailable from "../../utils/checkLRC";
import { getSequenceFromPosition } from "../../utils/getSequenceFromPosition";
import ActionComponents from "../ActionComponent";
import AudioSettingsModal from "../AudioSettingsModal";
import DownloadButton from "../DownloadButton";
import MinimizePlayer from "../MinimizePlayer";
import ScrollViewComponent from "../ScrollViewComponent";

const AudioControlBar = ({
  isPlaying,
  isBuffering = false,
  handlePlayPause,
  progress,
  handleSeek,
  isAudioEnabled,
  handleTrackSelect,
  onCloseTrackModal,
  baniID,
  title = undefined,
  notificationTitle = "",
  currentPlaying = null,
  addTrackToManifest,
  isTrackDownloaded,
  tracks,
  seekTo,
  setRate,
  isInitialized,
  addAndPlayTrack,
  play,
  isPlayerActionLoading = false,
  skipNextLoadRef = undefined,
  isNavBarVisible = false,
  barsDrop = 0,
  onHideBars = () => {},
  onPlayerTouch = () => {},
  onTrackListOpen = () => {},
}) => {
  const dispatch = useDispatch();
  const { theme } = useAudioTheme();
  const styles = useAudioThemedStyles(audioControlBarStyles);
  const fontFace = useSelector((state) => state.fontFace);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMoreTracksModalOpen, setIsMoreTracksModalOpen] = useState(false);
  // Instant swap between the full player and the mini pill — no crossfade
  // animation (it caused flicker). Only one of the two is mounted at a time.
  const [isMinimized, setIsMinimized] = useState(false);
  // Mirrored so `setMinimized` below can dedupe without depending on the state
  // it sets, the same shape as the Reader own setBarsVisible.
  const isMinimizedRef = useRef(isMinimized);
  isMinimizedRef.current = isMinimized;
  const [isLyricsAvailable, setIsLyricsAvailable] = useState(false);
  const [isLyricsChecking, setIsLyricsChecking] = useState(true);
  // Single source of truth (NetworkProvider) — gates tapping a non-downloaded
  // reciter in the inline Audios list while offline, same guard AudioTrackDialog
  // already uses, so a tap can never leave playback stuck trying to stream with
  // no network.
  const { isOffline } = useNetwork();

  // The ONE path between the full player and the floating one. Every caller
  // says why, so each conversion is recorded once and the analytics cannot
  // drift from the UI — the mini/micro pair is funnelled the same way inside
  // MinimizePlayer.
  const setMinimized = useCallback((minimized, trigger) => {
    if (isMinimizedRef.current === minimized) return;
    isMinimizedRef.current = minimized;
    setIsMinimized(minimized);
    trackPlayerForm(minimized ? "mini" : "full", trigger);
  }, []);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const baniLength = useSelector((state) => state.baniLength);
  const progressRef = useRef(progress);
  const currentPlayingRef = useRef(currentPlaying);
  const audioProgress = useSelector((state) => state.audioProgress);
  const isPlayerDragging = useSelector((state) => state.isPlayerDragging);
  // When baniLength changes while playing, the reducer clears saved progress for
  // length-variant banis. Guard the periodic save and unmount save so they don't
  // write the stale position straight back before the safe-exit fires.
  const mountBaniLengthRef = useRef(baniLength);
  const baniLengthChangedRef = useRef(false);
  const [isSeekLoading, setIsSeekLoading] = useState(false);
  const [displayDuration, setDisplayDuration] = useState(0);
  const [durationTrackId, setDurationTrackId] = useState(null);
  const [optimisticSeekPosition, setOptimisticSeekPosition] = useState(null);
  // Set once loadActiveTrack confirms the track is in RNTP. Until then, RNTP
  // may still be reporting the previous track's position, so safePosition
  // ignores progress.position and shows the saved/restore value instead.
  const [confirmedCurrentTrackId, setConfirmedCurrentTrackId] = useState(null);
  const optimisticSeekTimerRef = useRef(null);
  // Snapshot of saved progress captured once on mount — see useEffect below.
  const initialProgressRef = useRef(null);
  const { modalHeight, modalOpacity } = useAnimation(isSettingsModalOpen, isMoreTracksModalOpen);
  // Called for its side effects (auto-enqueue current track + stamp manifest);
  // per-track download UI now lives in DownloadButton, so no return value is used.
  useDownloadManager(
    currentPlaying,
    addTrackToManifest,
    isTrackDownloaded,
    baniID,
    title,
    notificationTitle || title
  );
  useBookmarks(seekTo, currentPlaying?.lyricsUrl);
  useArtistListeningDuration(baniID, title, isPlaying, currentPlaying);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // Auto-resume on screen focus: when the user navigates back to the audio
  // screen (via device back button, back arrow, or tab re-tap from Settings/
  // Bookmarks), check if autoplay is ON and the same track is already loaded.
  // The existing loadActiveTrack effect only fires on currentPlaying?.id
  // change, which doesn't happen on simple back-navigation.
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      if (!isAudioAutoPlay || !isInitialized || !currentPlaying?.id) return;

      try {
        const activeTrack = await TrackPlayer.getActiveTrack();
        const isSameTrack =
          activeTrack?.id != null && String(activeTrack.id) === String(currentPlaying.id);

        if (isSameTrack) {
          await play();
        }
      } catch (_) {
        // Non-critical — user can always tap play manually.
      }
    });

    return unsubscribe;
  }, [navigation, isAudioAutoPlay, isInitialized, currentPlaying?.id, play]);

  const sanitizeDuration = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return 0;
    }
    // Guard against corrupted native metadata spikes (e.g., very large bogus values).
    const MAX_REASONABLE_DURATION_SECONDS = 12 * 60 * 60;
    return Math.min(numericValue, MAX_REASONABLE_DURATION_SECONDS);
  };

  const sanitizePosition = (value, duration) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return 0;
    }
    if (duration > 0) {
      return Math.min(numericValue, duration);
    }
    return numericValue;
  };

  const getTrackId = (track) => (track?.id != null ? String(track.id) : null);

  const formatTime = (seconds) => {
    const safeSeconds = sanitizePosition(seconds, 0);
    const mins = Math.floor(safeSeconds / 60);
    const secs = Math.floor(safeSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Memoize slider color to avoid recalculating on every render
  const sliderMinTrackColor = useMemo(() => {
    if (!isAudioEnabled) return theme.c.border;
    return theme.c.textBrand;
  }, [isAudioEnabled, theme.c.border, theme.c.textBrand]);

  useEffect(() => {
    // Avoid showing stale duration from a previous track while new metadata is loading.
    setDisplayDuration(0);
    setDurationTrackId(getTrackId(currentPlaying));
  }, [currentPlaying?.id]);

  useEffect(() => {
    const currentTrackId = getTrackId(currentPlaying);
    if (!currentTrackId) {
      setDisplayDuration(0);
      setDurationTrackId(null);
      return;
    }

    const nativeDuration = sanitizeDuration(progress.duration);
    const manifestDuration = Number(currentPlaying?.trackLengthSec) || 0;

    // Guard against stale ELST atoms in stream-copied/trimmed M4A files:
    // if the native player reports a duration far beyond the manifest value
    // (e.g. the edit list still references the original full-file length),
    // fall back to the manifest value so the slider doesn't collapse.
    const isNativeSuspect =
      manifestDuration > 0 && nativeDuration > manifestDuration * 1.1;
    const nextDuration = isNativeSuspect ? manifestDuration : (nativeDuration || 0);
    setDisplayDuration(nextDuration);
    setDurationTrackId(currentTrackId);
  }, [currentPlaying?.id, progress.duration]);

  const sliderMax =
    durationTrackId && durationTrackId === getTrackId(currentPlaying) && displayDuration > 0
      ? displayDuration
      : (Number(currentPlaying?.trackLengthSec) || 0);

  const safePosition = useMemo(
    () => {
      // While loadActiveTrack hasn't confirmed the new track in RNTP yet,
      // progress.position may still be the previous track's stale value (e.g.
      // 4:44 from a just-left track). Show saved/restore position or 0 instead.
      if (confirmedCurrentTrackId !== String(currentPlaying?.id ?? "")) {
        const savedProgress = audioProgress?.[baniID];
        if (savedProgress?.trackId && String(savedProgress.trackId) === String(currentPlaying?.id)) {
          const candidatePos = savedProgress.position || 0;
          const manifestDuration = Number(currentPlaying?.trackLengthSec) || 0;
          const trackCompleted = manifestDuration > 0 && candidatePos >= manifestDuration - 5;
          if (!trackCompleted && candidatePos > 0) {
            return sliderMax > 0 ? sanitizePosition(candidatePos, sliderMax) : candidatePos;
          }
        }
        return 0;
      }

      let basePosition = progress.position;

      // If native player hasn't caught up (position is 0 or near-0 right after
      // addAndPlayTrack / reset), show the Redux-saved position to avoid a 0:00 flash.
      // isSeekLoading is intentionally excluded: keeping it here caused the stale
      // Redux position to flash over the live player position on every focus return.
      if (!basePosition || basePosition < 0.5) {
        const savedProgress = audioProgress?.[baniID];
        if (savedProgress?.trackId && String(savedProgress.trackId) === String(currentPlaying?.id)) {
          const candidatePos = savedProgress.position || basePosition;
          const manifestDuration = Number(currentPlaying?.trackLengthSec) || 0;
          const trackCompleted = manifestDuration > 0 && candidatePos >= manifestDuration - 5;
          if (!trackCompleted) {
            basePosition = candidatePos;
          }
        }
      }

      if (optimisticSeekPosition != null) {
        basePosition = optimisticSeekPosition;
      }

      if (sliderMax <= 0) {
        return basePosition;
      }

      return sanitizePosition(basePosition, sliderMax);
    },
    [progress.position, sliderMax, optimisticSeekPosition, audioProgress, baniID, currentPlaying?.id, confirmedCurrentTrackId]
  );

  useEffect(() => {
    if (optimisticSeekPosition == null) {
      return;
    }

    const nativePosition = sanitizePosition(progress.position, sliderMax);
    if (Math.abs(nativePosition - optimisticSeekPosition) <= 1.2) {
      setOptimisticSeekPosition(null);
      if (optimisticSeekTimerRef.current) {
        clearTimeout(optimisticSeekTimerRef.current);
        optimisticSeekTimerRef.current = null;
      }
    }
  }, [progress.position, sliderMax, optimisticSeekPosition]);

  useEffect(() => {
    return () => {
      if (optimisticSeekTimerRef.current) {
        clearTimeout(optimisticSeekTimerRef.current);
      }
    };
  }, []);

  const handleSliderSeekComplete = async (valueArray) => {
    const requested = Array.isArray(valueArray) ? Number(valueArray[0]) : Number(valueArray);
    if (!Number.isFinite(requested)) {
      return;
    }

    const bounded = sanitizePosition(requested, sliderMax);
    setOptimisticSeekPosition(bounded);

    if (optimisticSeekTimerRef.current) {
      clearTimeout(optimisticSeekTimerRef.current);
    }
    optimisticSeekTimerRef.current = setTimeout(() => {
      setOptimisticSeekPosition(null);
      optimisticSeekTimerRef.current = null;
    }, 2200);

    await handleSeek(bounded);
  };

  // Keep refs updated with latest values
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    currentPlayingRef.current = currentPlaying;
  }, [currentPlaying]);

  useEffect(() => {
    if (baniLength !== mountBaniLengthRef.current) {
      baniLengthChangedRef.current = true;
    }
  }, [baniLength]);

  // Snapshot saved progress once on mount — before any in-session playback saves can
  // overwrite audioProgress in Redux and accidentally re-trigger loadActiveTrack.
  useEffect(() => {
    initialProgressRef.current = audioProgress?.[baniID] ?? null;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save progress when user closes the modal
  const handleClose = async () => {
    const currentProgress = progressRef.current;
    const currentTrack = currentPlayingRef.current;
    const closeDuration =
      sanitizeDuration(currentProgress?.duration) || sanitizeDuration(currentTrack?.trackLengthSec);
    const closePosition = sanitizePosition(currentProgress?.position, closeDuration);

    if (currentTrack?.id && closePosition != null) {
      // Save sequence along with position
      let sequence = null;
      if (currentTrack?.lyricsUrl) {
        sequence = await getSequenceFromPosition(currentTrack.lyricsUrl, closePosition);
      }
      dispatch(setAudioProgress(baniID, currentTrack.id, closePosition, sequence));
    }

    onCloseTrackModal();
  };

  const actionComponents = [
    {
      selector: isMoreTracksModalOpen,
      toggle: setIsMoreTracksModalOpen,
      Icon: MusicNoteIcon,
      text: STRINGS.MUSIC,
    },
    {
      selector: isSettingsModalOpen,
      toggle: setIsSettingsModalOpen,
      Icon: SettingsIcon,
      text: STRINGS.OPTIONS,
    },
  ];

  // Switching reciters from the inline Audios list closes the list back down —
  // the same "pick and collapse" behaviour a chooser is expected to have,
  // instead of leaving it open over the newly-selected track.
  const handleInlineTrackSelect = useCallback(
    (track) => {
      setIsMoreTracksModalOpen(false);
      handleTrackSelect(track);
    },
    [handleTrackSelect]
  );

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
      // The inline reciter list is a list opening like any other: the owner
      // refetches the manifest behind it so it never shows a stale catalog.
      onTrackListOpen();
    }
  }, [isMoreTracksModalOpen]);

  useEffect(() => {
    const checkLyrics = async () => {
      setIsLyricsChecking(true);
      if (currentPlaying?.lyricsUrl) {
        const isAvailable = await checkLyricsFileAvailable(currentPlaying?.lyricsUrl);
        setIsLyricsAvailable(isAvailable);
      } else {
        setIsLyricsAvailable(false);
      }
      setIsLyricsChecking(false);
    };
    checkLyrics();
  }, [currentPlaying?.lyricsUrl]);

  // Load the active track when component mounts or currentPlaying changes
  useEffect(() => {
    const loadActiveTrack = async () => {
      if (!isInitialized || !currentPlaying?.id || !currentPlaying?.audioUrl) {
        return;
      }

      // Guard: if handleTrackSelect already initiated playback via
      // addAndPlayTrack (which sets skipNextLoadRef = true), skip this
      // effect to prevent the destructive double-load race condition.
      // M4A moov parse takes seconds — a second reset() kills it.
      if (skipNextLoadRef?.current) {
        skipNextLoadRef.current = false;
        setConfirmedCurrentTrackId(String(currentPlaying.id));
        return;
      }

      try {
        setIsSeekLoading(true);
        const activeTrack = await TrackPlayer.getActiveTrack();
        // A track is truly "the same" only when both the ID and the audio URL
        // match. Bani-length variants share the same track_id but use different
        // M4A files depending on the selected length, so an
        // ID-only check would incorrectly skip the reload when the user switches
        // bani length while audio is already loaded in the player.
        // Compare by canonical remote URL so a prefetch/download URL swap
        // (remote → file://) doesn't falsely trigger a reload. For bani-length
        // variants that reuse the same track_id with different audio files, the
        // remoteUrl stored on the RNTP track will differ from currentPlaying's
        // canonical URL, correctly triggering a reload.
        const activeTrackCanonicalUrl = activeTrack?.remoteUrl || activeTrack?.url;
        const currentCanonicalUrl = currentPlaying.remoteUrl || currentPlaying.audioUrl;
        const isSameActiveTrack =
          activeTrack?.id != null &&
          String(activeTrack.id) === String(currentPlaying.id) &&
          activeTrackCanonicalUrl === currentCanonicalUrl;

        // Keep current playback timeline when reopening the same bani/track.
        if (isSameActiveTrack) {
          if (isAudioAutoPlay && isFocused) {
            await play();
          }
          setConfirmedCurrentTrackId(String(currentPlaying.id));
          setIsSeekLoading(false);
          return;
        }

        // Load the track (will seek to saved position if available)
        await addAndPlayTrack(
          currentPlaying.id,
          currentPlaying.audioUrl,
          notificationTitle || title,
          currentPlaying.displayName,
          currentPlaying.lyricsUrl,
          currentPlaying.trackLengthSec,
          currentPlaying.trackSizeMB,
          false,
          currentPlaying.remoteUrl || currentPlaying.audioUrl
        );

        // Check if we have saved progress for this track (snapshot from mount time)
        if (initialProgressRef.current) {
          const savedProgress = initialProgressRef.current;
          const isSavedProgressForCurrentTrack =
            savedProgress.trackId != null && String(savedProgress.trackId) === String(currentPlaying.id);

          // Restore exact saved position if it belongs to the currently selected track.
          // We intentionally avoid restoring from sequence ID to prevent snapping backwards
          // to the start of a lyric block, which causes the user to lose progress.
          if (savedProgress.position && isSavedProgressForCurrentTrack) {
            await seekTo(savedProgress.position);
          }
        }

        if (isAudioAutoPlay && isFocused) {
          await play();
        }
        setConfirmedCurrentTrackId(String(currentPlaying.id));
        setIsSeekLoading(false);
      } catch (error) {
        handlePlayerError("loading active track", error);
        setIsSeekLoading(false);
      }
    };

    loadActiveTrack();
  }, [
    isInitialized,
    currentPlaying?.id,
    currentPlaying?.audioUrl,
    currentPlaying?.lyricsUrl,
    baniID,
    isFocused,
  ]);

  // Save audio progress when component unmounts or user leaves the screen
  useEffect(() => {
    return () => {
      const currentProgress = progressRef.current;
      const currentTrack = currentPlayingRef.current;
      const trackId = currentTrack?.id;
      const unmountDuration =
        sanitizeDuration(currentProgress?.duration) || sanitizeDuration(currentTrack?.trackLengthSec);
      const unmountPosition = sanitizePosition(currentProgress?.position, unmountDuration);
      if (trackId && unmountPosition != null) {
        if (
          baniLengthChangedRef.current &&
          constant.BANI_IDS_WITH_LENGTH_VARIANTS.includes(Number(baniID))
        ) {
          return;
        }
        // Save sequence along with position
        (async () => {
          let sequence = null;
          const lyricsUrl = currentTrack?.lyricsUrl;
          if (lyricsUrl) {
            sequence = await getSequenceFromPosition(lyricsUrl, unmountPosition);
          }
          dispatch(setAudioProgress(baniID, trackId, unmountPosition, sequence));
        })();
      }
    };
  }, [baniID]);

  // iOS kills the app fast on swipe-up and the unmount cleanup above doesn't
  // run in time for redux-persist to flush. Mirror the read-position pattern
  // from ReaderScreen (which dispatches on every scroll event so disk stays
  // seconds-fresh) by persisting playback position every few seconds while
  // playing. Now an iOS kill at any moment loses at most ~5s of progress.
  useEffect(() => {
    if (!isPlaying || !currentPlaying?.id) return undefined;

    const intervalId = setInterval(() => {
      const currentProgress = progressRef.current;
      const currentTrack = currentPlayingRef.current;
      const trackId = currentTrack?.id;
      if (!trackId) return;
      if (
        baniLengthChangedRef.current &&
        constant.BANI_IDS_WITH_LENGTH_VARIANTS.includes(Number(baniID))
      ) {
        return;
      }

      const persistDuration =
        sanitizeDuration(currentProgress?.duration) ||
        sanitizeDuration(currentTrack?.trackLengthSec);
      const persistPosition = sanitizePosition(currentProgress?.position, persistDuration);
      if (persistPosition <= 0) return;

      const lyricsUrl = currentTrack?.lyricsUrl;
      if (!lyricsUrl) {
        dispatch(setAudioProgress(baniID, trackId, persistPosition, null));
        return;
      }
      (async () => {
        let sequence = null;
        try {
          sequence = await getSequenceFromPosition(lyricsUrl, persistPosition);
        } catch (_) {
          // Best-effort sequence — falls back to position-only on restore.
        }
        dispatch(setAudioProgress(baniID, trackId, persistPosition, sequence));
      })();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isPlaying, currentPlaying?.id, baniID, dispatch]);

  // Keep toasts clear of whichever form of the player is on screen. The
  // expanded bar sits in normal flow, so this wrapper measures it; the
  // collapsed pill is absolutely positioned and contributes nothing to that
  // height, so its known footprint is used instead.
  const [footerHeight, setFooterHeight] = useState(0);
  const handleFooterLayout = useCallback((e) => {
    setFooterHeight(e.nativeEvent.layout.height);
  }, []);
  useEffect(() => {
    setToastBottomReservation(isMinimized ? MINIMIZED_PLAYER_FOOTPRINT : footerHeight);
    // Released on unmount so a toast fired from any other screen sits at its
    // normal resting offset.
    return () => setToastBottomReservation(0);
  }, [isMinimized, footerHeight]);

  return (
    // onTouchStart here catches EVERY form and control in one place: the full
    // bar, the pill and the circle all live under this view. It is box-none, so
    // a touch landing where the player is NOT passes through to the page and
    // never fires this — which is exactly the line that has to be drawn.
    <View
      style={styles.container}
      pointerEvents="box-none"
      onLayout={handleFooterLayout}
      onTouchStart={onPlayerTouch}
    >
      {/* DownloadBadge replaced by DownloadButton in the trackInfo row */}
      {isMinimized && (
        <MinimizePlayer
          setMinimized={setMinimized}
          handlePlayPause={handlePlayPause}
          isPlaying={isPlaying}
          progress={formatTime(safePosition)}
          duration={sliderMax > 0 ? formatTime(sliderMax) : "0:00"}
          displayName={currentPlaying?.displayName || ""}
          isDragging={isPlayerDragging}
          isNavBarVisible={isNavBarVisible}
          barsDrop={barsDrop}
          onHideBars={onHideBars}
        />
      )}
      {!isMinimized && (
        <View style={[styles.mainContainer, Platform.OS === "ios" && styles.mainContainerIOS]}>
        {Platform.OS === "ios" && (
          <BlurView
            style={styles.blurOverlay}
            blurType={theme.chrome.blurType}
            blurAmount={5}
            reducedTransparencyFallbackColor={theme.c.surface}
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
            {!isMoreTracksModalOpen && !isSettingsModalOpen && currentPlaying && (
              <Pressable
                style={styles.controlIcon}
                onPress={() => setMinimized(true, "control")}
              >
                <ExpandCollapseIcon size={26} color={theme.c.textBrand} />
              </Pressable>
            )}
            {actionItems.map((item) => (
              <Pressable key={item.id} style={styles.controlIcon} onPress={item.onPress}>
                <item.Icon size={30} color={theme.c.textBrand} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Separator */}
        <View style={styles.separator} />
        <Animated.View
          style={[styles.modalAnimation, { maxHeight: modalHeight, opacity: modalOpacity }]}
        >
          {isSettingsModalOpen && (
            <AudioSettingsModal
              isLyricsAvailable={isLyricsAvailable}
              isLyricsChecking={isLyricsChecking}
              setRate={setRate}
            />
          )}

          {isMoreTracksModalOpen && (
            <View style={styles.moreTracksModalContainer}>
              {/* The heading rides INSIDE the scroller. Above it, in a panel
                  capped by an animated maxHeight, it was the first thing lost
                  at a raised OS text size — and lost silently, since there was
                  no way to scroll up to something clipped off the top. */}
              <ScrollViewComponent
                tracks={tracks}
                selectedTrack={currentPlaying}
                playingTrack={currentPlaying}
                isPlaying={isPlaying}
                isOffline={isOffline}
                handleSelectTrack={handleInlineTrackSelect}
                header={
                  <CustomText style={styles.moreTracksHeaderText}>
                    {STRINGS.please_choose_a_track}{" "}
                    <CustomText style={{ fontFamily: fontFace }}>{title}</CustomText>
                  </CustomText>
                }
              />
            </View>
          )}
        </Animated.View>

        {isMoreTracksModalOpen && <View style={styles.separator} />}

        {/* Main Playback Section */}
        <View style={[styles.mainSection]}>
          <View style={styles.trackInfo}>
            {/* Artist name. Gives way to the download icon and the timestamp,
                which keep their size — but STARTS from its own width rather
                than from zero. `flex: 1` here meant `flexBasis: 0`, so the pair
                on the right was served in full and the name lived on the
                remainder, which at a raised OS text size is a couple of words
                wide. */}
            <View style={[styles.trackInfoLeft, { flexGrow: 1, flexShrink: 1, flexBasis: "auto" }]}>
              {currentPlaying && currentPlaying.displayName && (
                // No line cap. One line gave "Bhai Jarnai…"; two gave "Bibi /
                // Indermoha…" — each cap is a guess at how many lines a reciter's
                // name needs, and the guess fails on the next longer name. A
                // truncated name identifies nobody, which defeats the one job
                // this label has. Nothing in the player has a fixed height, so
                // it takes the lines it needs.
                <CustomText style={styles.trackName}>{currentPlaying.displayName}</CustomText>
              )}
            </View>
            {/* Download indicator + timestamp — stay right-aligned as a unit */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {currentPlaying && (
                <DownloadButton
                  track={currentPlaying}
                  baniTitle={title}
                  baniNameUni={notificationTitle || title}
                  baniId={baniID}
                />
              )}
              <CustomText style={[styles.timestamp, styles.timestampWithColor]}>
                {formatTime(safePosition)}
              </CustomText>
            </View>
          </View>

          <View style={styles.playbackControls}>
            <Pressable
              style={styles.playButton}
              onPress={handlePlayPause}
              disabled={!isAudioEnabled || isPlayerActionLoading || isBuffering}
            >
              {isPlayerActionLoading || isBuffering ? (
                <Spinner
                  testID="player-action-loading-indicator"
                  size="small"
                  color={theme.c.textBrand}
                  style={styles.playButtonLoadingSpinner}
                />
              ) : isPlaying ? (
                <PauseIcon size={30} color={theme.c.textBrand} />
              ) : (
                <PlayIcon size={30} color={theme.c.textBrand} />
              )}
            </Pressable>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                {isSeekLoading && (
                  <View style={styles.seekLoadingOverlay} testID="seek-loading-indicator">
                    <Spinner size="small" color={theme.c.textBrand} />
                  </View>
                )}
                <Slider
                  value={safePosition}
                  minimumValue={0}
                  maximumValue={sliderMax}
                  onSlidingComplete={handleSliderSeekComplete}
                  minimumTrackTintColor={sliderMinTrackColor}
                  maximumTrackTintColor={theme.c.surfaceSelected}
                  disabled={!isAudioEnabled || isSeekLoading}
                  trackStyle={{
                    height: 6,
                    borderRadius: 3,
                  }}
                  thumbTintColor={sliderMinTrackColor}
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
      )}
    </View>
  );
};

AudioControlBar.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  isBuffering: PropTypes.bool,
  handlePlayPause: PropTypes.func.isRequired,
  progress: PropTypes.shape({
    position: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
  }).isRequired,
  handleTrackSelect: PropTypes.func.isRequired,
  handleSeek: PropTypes.func.isRequired,
  isAudioEnabled: PropTypes.bool.isRequired,
  title: PropTypes.string,
  notificationTitle: PropTypes.string,
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
  setRate: PropTypes.func.isRequired,
  isInitialized: PropTypes.bool.isRequired,
  addAndPlayTrack: PropTypes.func.isRequired,
  play: PropTypes.func.isRequired,
  isPlayerActionLoading: PropTypes.bool,
  skipNextLoadRef: PropTypes.shape({ current: PropTypes.bool }),
  isNavBarVisible: PropTypes.bool,
  barsDrop: PropTypes.number,
  onHideBars: PropTypes.func,
  /** Any touch on the player, so the page cannot report it as a tap on the bani. */
  onPlayerTouch: PropTypes.func,
  onTrackListOpen: PropTypes.func,
};

export default AudioControlBar;
