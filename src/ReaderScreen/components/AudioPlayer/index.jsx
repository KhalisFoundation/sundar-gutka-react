import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Linking } from "react-native";
import TrackPlayer from "react-native-track-player";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import {
  toggleAudio,
  setDefaultAudio,
  setAudioProgress,
} from "@common/actions";
import { showErrorToast } from "@common/toast";
import { handlePlayerError } from "@common/TrackPlayerUtils";
import {
  STRINGS,
  constant,
  trackBaniOpen,
  trackBaniListenCompletion,
  trackAudioLinkRequest,
  trackAudioEvent,
  openInAppBrowser,
} from "@common";
import { AudioTrackDialog, AudioControlBar, ErrorFallback, Loading } from "./components";
import { useTrackPlayer, useAudioSyncScroll, useAudioManifest } from "./hooks";
import useListeningSession from "@common/hooks/useListeningSession";
import { getSequenceFromPosition } from "./utils/getSequenceFromPosition";
import { getLocalTrackPath, prefetchPreviews } from "./utils/audioDownloader";

// How far RNTP's reported duration may sit from the manifest's before the two
// are taken to be different tracks. A couple of seconds absorbs the usual
// disagreement between a container's header and the decoded stream; anything
// beyond it means RNTP has not switched over yet. See the completion sampler.
const TRACK_MATCH_TOLERANCE_SEC = 2;

const AudioPlayer = ({
  baniID,
  title,
  notificationTitle,
  webViewRef,
  isNavBarVisible = false,
  barsDrop = 0,
  onHideBars = () => {},
  onShowBars = () => {},
  onPlayerTouch = () => {},
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const defaultAudio = useSelector((state) => state.defaultAudio);
  const hasSavedTrackForCurrentBani = Boolean(defaultAudio?.[baniID]?.id);
  const [showTrackModal, setShowTrackModal] = useState(!hasSavedTrackForCurrentBani);
  const [isPlayerActionLoading, setIsPlayerActionLoading] = useState(false);
  const [seekSyncRequest, setSeekSyncRequest] = useState(null);
  // Guard ref: prevents the safe-exit effect from reopening the modal during
  // an active handleTrackSelect transition (React state + Redux dispatch can
  // commit in separate render batches, causing a false-positive defaultAudioWiped).
  const isSelectingTrackRef = useRef(false);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const audioPlaybackSpeed = useSelector((state) => state.audioPlaybackSpeed);
  const baniLength = useSelector((state) => state.baniLength);
  const language = useSelector((state) => state.language);
  const [hasAutoRestoredView, setHasAutoRestoredView] = useState(false);
  const {
    isPlaying,
    isBuffering,
    progress,
    play,
    pause,
    stop,
    addAndPlayTrack,
    seekTo,
    setRate,
    isAudioEnabled,
    isInitialized,
    reset,
    isInitializing,
    retryInitialization,
    skipNextLoadRef,
  } = useTrackPlayer();
  const {
    tracks,
    currentPlaying,
    setCurrentPlaying,
    isTracksLoading,
    addTrackToManifest,
    isTrackDownloaded,
    manifestError,
    refetchManifest,
    refreshManifestSilently,
    isAudioUnavailableForCurrentLengthOnly,
  } = useAudioManifest(baniID);

  // Every opening of the track list asks the backend again, behind the list
  // that is already showing: a reciter added an hour ago appears now rather
  // than after the daily TTL, and a downloaded track the backend has since
  // changed is corrected (see audioReconcile) while the user is looking at it.
  useEffect(() => {
    if (showTrackModal) refreshManifestSilently();
  }, [showTrackModal]);

  // Disable sync scroll while preview modal is open to prevent stale lyrics
  // from a previously selected track driving WebView scroll.
  useAudioSyncScroll(
    progress,
    !showTrackModal && isPlaying,
    webViewRef,
    showTrackModal ? null : currentPlaying?.lyricsUrl,
    seekSyncRequest
  );
  useListeningSession({
    baniId: baniID,
    baniTitle: title,
    isPlaying,
    currentPlayingId: currentPlaying?.id ?? null,
    artistId: currentPlaying?.artistID ?? null,
    artistName: currentPlaying?.displayName ?? null,
  });

  useEffect(() => {
    trackBaniOpen(baniID, title, defaultAudio[baniID]?.displayName);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ref so handleTrackSelect can read current position without triggering effect re-runs every 100ms
  const progressRef = useRef(progress);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  // How far into a track the reader actually got, reported once on leaving.
  //
  // Sampled ONLY while audio is genuinely playing AND only once RNTP confirms
  // it is on THIS track. Both conditions are load-bearing; the event used to
  // have neither, and was wrong in two separate ways because of it.
  //
  //   It fired on any `position > 0` at exit. The player SEEKS to a saved
  //   position when a bani is reopened, so someone who opened a bani they had
  //   listened to before, read for a moment and left without ever pressing
  //   play was logged as having listened — at whatever percent they had
  //   previously reached, frequently "completed". That is why more users had a
  //   completion than had a `bani_listen`, which the name says is impossible.
  //
  //   It read `progress.position` raw. While a newly chosen track loads, RNTP
  //   still reports the PREVIOUS track's position — the exact staleness the
  //   visible timer already defends against (AudioControlBar's `safePosition`,
  //   "flash of saved progress from other last played track"). A completion
  //   could therefore carry one bani's position under another bani's id.
  //
  // Sampling during confirmed playback answers both at once: nothing played
  // means there is nothing to report, and a position seen while this track is
  // playing cannot belong to a different one.
  const completionSampleRef = useRef(null);
  const completionFiredRef = useRef(false);
  const currentTrackId = currentPlaying?.id ?? null;

  // A new track is a new session — nothing of it has been played yet, and
  // leaving may report it once more.
  useEffect(() => {
    completionSampleRef.current = null;
    completionFiredRef.current = false;
  }, [currentTrackId]);

  useEffect(() => {
    if (!isPlaying) return;
    // RNTP reports the ACTIVE track's duration alongside its position. Until
    // that matches the track we believe is playing, the pair belongs to the
    // previous one — this is the confirmation the old code lacked.
    const activeDuration = Number(progress?.duration) || 0;
    const expectedDuration = Number(currentPlaying?.trackLengthSec) || 0;
    if (activeDuration <= 0) return;
    if (
      expectedDuration > 0 &&
      Math.abs(activeDuration - expectedDuration) > TRACK_MATCH_TOLERANCE_SEC
    ) {
      return;
    }
    const positionSec = Number(progress?.position) || 0;
    if (positionSec <= 0) return;
    completionSampleRef.current = {
      positionSec,
      // What RNTP is actually playing, not the manifest's estimate of it, so
      // percent_complete is computed against the same clock as the position.
      trackLengthSec: activeDuration,
      artist: currentPlaying?.displayName ?? null,
    };
  }, [
    isPlaying,
    progress?.position,
    progress?.duration,
    currentPlaying?.trackLengthSec,
    currentPlaying?.displayName,
  ]);

  // Fire bani_listen_completion once when the user leaves this screen.
  //
  // The fired-guard is reset ONLY by a track change, never by a progress tick.
  // It used to be cleared on every tick, so audio still playing after the blur
  // reset it and the unmount safety-net fired a second time — one exit, two
  // events.
  useEffect(() => {
    const fireCompletion = () => {
      if (completionFiredRef.current) return;
      const sample = completionSampleRef.current;
      // No confirmed playback on this screen, so there is no completion to
      // report. Silence is the correct answer, not a zero.
      if (!sample) return;
      completionFiredRef.current = true;
      trackBaniListenCompletion(
        baniID,
        title,
        sample.artist,
        sample.positionSec,
        sample.trackLengthSec
      );
    };
    const unsubscribe = navigation.addListener("blur", fireCompletion);
    return () => {
      unsubscribe();
      fireCompletion(); // safety-net on unmount
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply saved playback speed when initialized
  useEffect(() => {
    if (isInitialized && audioPlaybackSpeed && setRate) {
      setRate(audioPlaybackSpeed);
    }
  }, [isInitialized, audioPlaybackSpeed, setRate]);

  const handlePlayPause = async () => {
    if (!isInitialized || !isAudioEnabled || !currentPlaying) {
      return;
    }

    try {
      setIsPlayerActionLoading(true);
      if (isPlaying) {
        await pause();
      } else {
        // Check if there's already a track loaded in the queue
        const currentTrack = await TrackPlayer.getActiveTrack();
        // If the current track matches what we want to play, just resume
        if (currentTrack && currentTrack.id === currentPlaying.id) {
          await play();
          return;
        }

        // Track not loaded, add and play it
        await addAndPlayTrack(
          currentPlaying.id,
          currentPlaying.audioUrl,
          notificationTitle || title,
          currentPlaying.displayName,
          currentPlaying.lyricsUrl,
          currentPlaying.trackLengthSec,
          currentPlaying.trackSizeMB,
          true,
          currentPlaying.remoteUrl || currentPlaying.audioUrl
        );
      }
    } catch (error) {
      handlePlayerError("in handlePlayPause", error);
      showErrorToast(`${STRINGS.UNABLE_TO_PLAY} ${STRINGS.PLEASE_TRY_AGAIN}`);
    } finally {
      setIsPlayerActionLoading(false);
    }
  };

  const onCloseTrackModal = useCallback(async () => {
    if (isPlaying) {
      await stop();
    }
    dispatch(toggleAudio(false));
    // Closing the player ends the reason the chrome was hidden. Opening it
    // hides the bars (onHideBars) because the user asked for the controls;
    // dismissing it leaves them on a bare page with no way back to the header
    // or the tab bar except a tap they have no reason to guess at.
    onShowBars();
  }, [isPlaying, onShowBars]);

  useEffect(() => {
    const autoStartFirstTrack = async () => {
      // Don't auto-start playback while the screen is not focused (e.g. user
      // is on Settings and changed bani length). Playback will start when
      // the user navigates back and isFocused flips to true.
      if (!isFocused || !isAudioAutoPlay || !showTrackModal || !isAudioEnabled || isTracksLoading) {
        return;
      }
      if (currentPlaying || (defaultAudio[baniID] && defaultAudio[baniID].audioUrl)) {
        return;
      }
      if (!tracks || tracks.length === 0) {
        return;
      }

      const firstPlayableTrack = tracks.find((track) => track?.audioUrl);
      if (!firstPlayableTrack) {
        return;
      }

      try {
        setIsPlayerActionLoading(true);
        // handleTrackSelect internally calls addAndPlayTrack — do not call it again here
        await handleTrackSelect(firstPlayableTrack);
      } catch (error) {
        handlePlayerError("auto-starting first track", error);
      } finally {
        setIsPlayerActionLoading(false);
      }
    };

    autoStartFirstTrack();
  }, [
    isFocused,
    isAudioAutoPlay,
    showTrackModal,
    isAudioEnabled,
    isTracksLoading,
    tracks,
    currentPlaying,
    defaultAudio,
    baniID,
    handleTrackSelect,
  ]);

  useEffect(() => {
    if (hasAutoRestoredView || !showTrackModal) {
      return;
    }

    const hasTracks = Array.isArray(tracks) && tracks.length > 0;
    const hasCurrentTrack = Boolean(currentPlaying?.id);
    const hasSavedDefaultTrack = Boolean(
      defaultAudio?.[baniID]?.id &&
      tracks?.some((t) => String(t.artistID) === String(defaultAudio[baniID].artistID))
    );

    if (hasTracks && (hasCurrentTrack || hasSavedDefaultTrack)) {
      setShowTrackModal(false);
      setHasAutoRestoredView(true);
    }
  }, [
    hasAutoRestoredView,
    showTrackModal,
    tracks,
    currentPlaying?.id,
    defaultAudio,
    baniID,
  ]);

  // Safe-exit: fires when bani length changes and the new track list no longer
  // includes the currently playing artist (e.g. InderMohan on Long/XL) or is
  // empty (XL — no artist recorded the opening Dohra). In both cases we stop
  // audio, clear currentPlaying, and return to the track-selection modal so the
  // user sees either the unavailable message or the valid artists for this length.
  useEffect(() => {
    if (isTracksLoading) return;
    // Skip while a track selection is in progress — React state (currentPlaying)
    // may have committed before the Redux dispatch (setDefaultAudio) propagates
    // through useSelector, which would cause a false-positive defaultAudioWiped.
    if (isSelectingTrackRef.current) return;

    const tracksEmpty = !Array.isArray(tracks) || tracks.length === 0;
    const currentArtistTrackInNewManifest = 
      currentPlaying?.artistID != null && Array.isArray(tracks)
        ? tracks.find((t) => String(t.artistID) === String(currentPlaying.artistID))
        : null;

    const currentArtistGone =
      currentPlaying?.artistID != null &&
      Array.isArray(tracks) &&
      tracks.length > 0 &&
      !currentArtistTrackInNewManifest;

    // Compared as FILES, not URL strings: the same track reads as a remote URL
    // before its download is merged in and as a local path after, and a
    // refreshed list must not throw the listener out over that. A different
    // file (the other length variant) still does.
    const currentTrackUrlChanged =
      currentArtistTrackInNewManifest != null &&
      currentPlaying?.audioUrl != null &&
      getLocalTrackPath(
        currentArtistTrackInNewManifest.remoteUrl || currentArtistTrackInNewManifest.audioUrl
      ) !== getLocalTrackPath(currentPlaying.remoteUrl || currentPlaying.audioUrl);

    // If the component remounted (e.g. returning from Settings), currentPlaying 
    // initializes to null. If the modal is hidden (because the app expected 
    // defaultAudio to be valid), but the saved artist is actually invalid for 
    // this length, we are stuck on a blank player. Force the modal open.
    const isStuckOnBlankPlayer =
      !showTrackModal &&
      !currentPlaying?.id &&
      Array.isArray(tracks) &&
      tracks.length > 0 &&
      !Boolean(
        defaultAudio?.[baniID]?.id &&
        tracks.some((t) => String(t.artistID) === String(defaultAudio[baniID].artistID))
      );

    // If defaultAudio for this bani was wiped from Redux (e.g., due to a bani length change),
    // we must exit and reset the player to show the modal again.
    const defaultAudioWiped = currentPlaying?.id != null && !defaultAudio?.[baniID]?.id;

    const needsExit = tracksEmpty || currentArtistGone || currentTrackUrlChanged || isStuckOnBlankPlayer || defaultAudioWiped;

    // Only execute if we actually need to change state (prevents infinite loop of stop/reset)
    if (needsExit && (!showTrackModal || currentPlaying != null)) {
      // Stop and reset the player silently, then surface the selection UI.
      (async () => {
        try { await stop(); } catch (_) {}
        try { await reset(); } catch (_) {}
      })();
      setCurrentPlaying(null);
      setShowTrackModal(true);
      setHasAutoRestoredView(true); // prevent autoRestore from hiding the modal immediately
    }
  }, [tracks, isTracksLoading, showTrackModal, currentPlaying?.id, defaultAudio, baniID]);


  const handleSeek = async (value) => {
    if (!isAudioEnabled || !isInitialized) return;
    try {
      setSeekSyncRequest({
        position: value,
        ts: Date.now(),
      });
      await seekTo(value);
    } catch (error) {
      handlePlayerError("seeking", error);
      showErrorToast(`${STRINGS.UNABLE_TO_SEEK} ${STRINGS.PLEASE_TRY_AGAIN}`);
    }
  };

  const handleTrackSelect = useCallback(
    async (selectedTrack) => {
      try {
        // Early return if selectedTrack is null or undefined
        if (!selectedTrack) {
          return;
        }

        isSelectingTrackRef.current = true;

        const previousTrack = currentPlaying;
        const previousPosition = progressRef.current?.position;

        // Stop current playback and reset queue so same-track reopening
        // doesn't retain old timeline/state (critical for preview -> full play transition)
        await stop();
        await reset();

        // Save current sequence before switching artists
        if (previousTrack?.id && previousPosition != null) {
          let currentSequence = null;
          if (previousTrack?.lyricsUrl) {
            currentSequence = await getSequenceFromPosition(previousTrack.lyricsUrl, previousPosition);
          }

          dispatch(
            setAudioProgress(baniID, previousTrack.id, previousPosition, currentSequence)
          );
        }

        // Dispatch Redux action BEFORE setting React state so that when the
        // safe-exit effect runs, defaultAudio is already up-to-date and the
        // defaultAudioWiped check doesn't false-positive.
        dispatch(setDefaultAudio(selectedTrack, baniID));

        // Set the new track as current and close modal together
        setCurrentPlaying(selectedTrack);
        setShowTrackModal(false);
        setHasAutoRestoredView(true);

        // After selecting a track (including from preview -> Next), enter full player
        // with playback already running so no extra Play tap is required.
        // Don't actually start playback if screen is not focused (e.g. bani
        // length changed while on Settings) — defer to focus-based auto-resume.
        if (isAudioEnabled) {
          const shouldPlay = isAudioAutoPlay && isFocused;
          setIsPlayerActionLoading(true);
          await addAndPlayTrack(
            selectedTrack.id,
            selectedTrack.audioUrl,
            notificationTitle || title,
            selectedTrack.displayName,
            selectedTrack.lyricsUrl,
            selectedTrack.trackLengthSec,
            selectedTrack.trackSizeMB,
            shouldPlay,
            selectedTrack.remoteUrl || selectedTrack.audioUrl
          );
          setIsPlayerActionLoading(false);
        }

      } catch (error) {
        handlePlayerError("switching track", error);
        showErrorToast(`${STRINGS.UNABLE_TO_SWITCH_TRACK} ${STRINGS.PLEASE_TRY_AGAIN}`);
        setIsPlayerActionLoading(false);
      } finally {
        isSelectingTrackRef.current = false;
      }
    },
    [baniID, isAudioEnabled, isAudioAutoPlay, isFocused, currentPlaying]
  );

  // Memoize error fallback renderer to prevent recreation
  const renderErrorFallback = useCallback(
    (message, retryFn) => (
      <ErrorFallback
        title={message}
        buttonPress={retryFn}
        buttonText={STRINGS.RETRY}
        handleClose={onCloseTrackModal}
      />
    ),
    []
  );

  // Warm the 15-second preview clips for this bani's tracks as soon as the set
  // is known, so tapping an artist plays instantly. Keyed on the track-set
  // signature so it fires once per bani, not on every re-render.
  const prefetchedPreviewSigRef = useRef(null);
  useEffect(() => {
    if (isTracksLoading || !Array.isArray(tracks) || tracks.length === 0) return;
    const signature = tracks.map((track) => track?.remoteUrl || track?.audioUrl).join("|");
    if (prefetchedPreviewSigRef.current === signature) return;
    prefetchedPreviewSigRef.current = signature;
    prefetchPreviews(tracks);
  }, [tracks, isTracksLoading]);

  // Memoize audio track dialog to prevent unnecessary re-renders
  const audioTrackDialog = useMemo(() => {
    if (!tracks || tracks.length === 0) {
      const LENGTH_LABELS = {
        [constant.SHORT]: STRINGS.short,
        MEDIUM: STRINGS.medium,
        [constant.LONG]: STRINGS.long,
        [constant.EXTRA_LONG]: STRINGS.extra_long,
      };
      const lengthLabel = LENGTH_LABELS[baniLength] || baniLength;
      const titleString = isAudioUnavailableForCurrentLengthOnly
        ? STRINGS.WE_DO_NOT_HAVE_AUDIOS_FOR_THIS_LENGTH.replace("{length}", lengthLabel)
        : STRINGS.WE_DO_NOT_HAVE_AUDIOS_FOR;

      return (
        <ErrorFallback
          title={titleString}
          baniTitle={title}
          buttonPress={async () => {
            const formUrl = "https://forms.gle/N4YBdzfYGLAFsDMW7";
            await trackAudioEvent("requestAudioLink", title || "unknown");
            try {
              await trackAudioLinkRequest(title, baniID, baniLength);
              await openInAppBrowser(formUrl);
            } catch (_) {
              Linking.openURL(formUrl).catch(() => {});
            }
          }}
          buttonText={STRINGS.REQUEST_AUDIO_FOR_THIS_PAATH}
          handleClose={onCloseTrackModal}
        />
      );
    }
    return (
      <AudioTrackDialog
        baniID={baniID}
        handleTrackSelect={handleTrackSelect}
        title={title}
        notificationTitle={notificationTitle || title}
        tracks={tracks}
        onCloseTrackModal={onCloseTrackModal}
        addAndPlayTrack={addAndPlayTrack}
        stop={stop}
        reset={reset}
        isPlaying={isPlaying}
      />
    );
    // isInitialized / isAudioEnabled MUST be deps: the dialog captures the
    // addAndPlayTrack/handleTrackSelect closures, which read isInitialized at
    // capture time. When a bani is reopened the manifest is served from cache so
    // `tracks` populate BEFORE the player finishes initializing — without these
    // deps the memo would freeze closures with isInitialized=false and every
    // preview tap would no-op forever. Recomputing when init completes re-captures
    // the closures with the correct ready state.
  }, [
    tracks,
    title,
    baniID,
    isPlaying,
    isAudioUnavailableForCurrentLengthOnly,
    language,
    baniLength,
    isInitialized,
    isAudioEnabled,
  ]);

  // Don't render if TrackPlayer is not initialized
  if (!isInitialized && !isInitializing) {
    return renderErrorFallback(STRINGS.INITIALIZING_AUDIO_PLAYER, retryInitialization);
  }

  if (manifestError) {
    return renderErrorFallback(STRINGS.NETWORK_ERROR, refetchManifest);
  }

  if (isInitializing || isTracksLoading) {
    return <Loading />;
  }

  return showTrackModal ? (
    audioTrackDialog
  ) : (
    <AudioControlBar
      baniID={baniID}
      handleTrackSelect={handleTrackSelect}
      isPlaying={isPlaying}
      isBuffering={isBuffering}
      handlePlayPause={handlePlayPause}
      progress={progress}
      handleSeek={handleSeek}
      isAudioEnabled={isAudioEnabled}
      title={title}
      notificationTitle={notificationTitle || title}
      currentPlaying={currentPlaying}
      onCloseTrackModal={onCloseTrackModal}
      addTrackToManifest={addTrackToManifest}
      isTrackDownloaded={isTrackDownloaded}
      tracks={tracks}
      seekTo={seekTo}
      reset={reset}
      pause={pause}
      setRate={setRate}
      isInitialized={isInitialized}
      addAndPlayTrack={addAndPlayTrack}
      play={play}
      isPlayerActionLoading={isPlayerActionLoading}
      skipNextLoadRef={skipNextLoadRef}
      isNavBarVisible={isNavBarVisible}
      barsDrop={barsDrop}
      onHideBars={onHideBars}
      onPlayerTouch={onPlayerTouch}
      onTrackListOpen={refreshManifestSilently}
    />
  );
};

AudioPlayer.propTypes = {
  baniID: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  webViewRef: PropTypes.shape({
    current: PropTypes.shape({
      postMessage: PropTypes.func,
    }),
  }).isRequired,
  isNavBarVisible: PropTypes.bool,
  barsDrop: PropTypes.number,
  /** Asks the Reader to keep its chrome hidden. See MinimizePlayer's pause. */
  onHideBars: PropTypes.func,
  /** Gives the chrome back when the player closes — the counterpart above. */
  onShowBars: PropTypes.func,
  /** Any touch on the player, so the page cannot report it as a tap on the bani. */
  onPlayerTouch: PropTypes.func,
};

export default AudioPlayer;
