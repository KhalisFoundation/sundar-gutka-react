import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Linking } from "react-native";
import TrackPlayer from "react-native-track-player";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import {
  toggleAudio,
  setDefaultAudio,
  setAudioProgress,
  toggleAudioSyncScroll,
} from "@common/actions";
import { showErrorToast } from "@common/toast";
import { STRINGS, logError, trackAudioEvent } from "@common";
import { AudioTrackDialog, AudioControlBar, ErrorFallback, Loading } from "./components";
import { useTrackPlayer, useAudioSyncScroll, useAudioManifest } from "./hooks";
import checkLyricsFileAvailable from "./utils/checkLRC";
import { getSequenceFromPosition } from "./utils/getSequenceFromPosition";

const AudioPlayer = ({ baniID, title, webViewRef }) => {
  const dispatch = useDispatch();
  const [showTrackModal, setShowTrackModal] = useState(true);
  const defaultAudio = useSelector((state) => state.defaultAudio);
  const audioPlaybackSpeed = useSelector((state) => state.audioPlaybackSpeed);
  const {
    isPlaying,
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
  } = useAudioManifest(baniID);

  // Audio sync scroll hook
  useAudioSyncScroll(progress, isPlaying, webViewRef, currentPlaying?.lyricsUrl);

  // Apply saved playback speed when initialized
  useEffect(() => {
    if (isInitialized && audioPlaybackSpeed && setRate) {
      setRate(audioPlaybackSpeed);
    }
  }, [isInitialized, audioPlaybackSpeed, setRate]);

  // Cleanup: stop audio when component unmounts
  useEffect(() => {
    return () => {
      (async () => {
        dispatch(toggleAudio(false));
        await stop();
      })();
    };
  }, []);

  const handlePlayPause = async () => {
    if (!isInitialized || !isAudioEnabled || !currentPlaying) {
      return;
    }

    try {
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
          currentPlaying.displayName,
          currentPlaying.displayName,
          currentPlaying.lyricsUrl,
          currentPlaying.trackLengthSec,
          currentPlaying.trackSizeMB,
          currentPlaying.remoteUrl || currentPlaying.audioUrl
        );
      }
    } catch (error) {
      logError("Error in handlePlayPause:", error);
      showErrorToast(`${STRINGS.UNABLE_TO_PLAY} ${STRINGS.PLEASE_TRY_AGAIN}`);
    }
  };

  const onCloseTrackModal = useCallback(async () => {
    if (isPlaying) {
      await stop();
    }
    dispatch(toggleAudio(false));
  }, [isPlaying]);

  // Combine both useEffect hooks to prevent multiple re-renders
  useEffect(() => {
    if (currentPlaying || (defaultAudio[baniID] && defaultAudio[baniID].audioUrl)) {
      setShowTrackModal(false);
    }
  }, [currentPlaying, defaultAudio, baniID]);

  const handleSeek = async (value) => {
    if (!isAudioEnabled || !isInitialized) return;
    try {
      await seekTo(value);
    } catch (error) {
      logError("Error seeking:", error);
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

        // Stop current playback
        await stop();

        // Set the new track as current and close modal together
        setCurrentPlaying(selectedTrack);
        setShowTrackModal(false);
        // Set the new track as current
        // Save current sequence before switching artists
        if (selectedTrack?.lyricsUrl && progress?.position != null) {
          const currentSequence = await getSequenceFromPosition(
            selectedTrack.lyricsUrl,
            progress.position
          );
          if (currentSequence != null && selectedTrack?.id) {
            dispatch(
              setAudioProgress(baniID, selectedTrack.id, progress.position, currentSequence)
            );
          }
        }

        // Dispatch action
        dispatch(setDefaultAudio(selectedTrack, baniID));

        // Auto-play the new track if audio is enabled
        if (isAudioEnabled) {
          await addAndPlayTrack(
            selectedTrack.id,
            selectedTrack.audioUrl,
            selectedTrack.displayName,
            selectedTrack.displayName,
            selectedTrack.lyricsUrl,
            selectedTrack.trackLengthSec,
            selectedTrack.trackSizeMB,
            selectedTrack.remoteUrl || selectedTrack.audioUrl
          );
        }
        const isLRCFileAvailable = await checkLyricsFileAvailable(selectedTrack.lyricsUrl);
        if (isLRCFileAvailable) {
          dispatch(toggleAudioSyncScroll(true));
        }
      } catch (error) {
        logError("Error switching track:", error);
        showErrorToast(`${STRINGS.UNABLE_TO_SWITCH_TRACK} ${STRINGS.PLEASE_TRY_AGAIN}`);
      }
    },
    [baniID, isAudioEnabled]
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

  // Memoize audio track dialog to prevent unnecessary re-renders
  const audioTrackDialog = useMemo(() => {
    if (!tracks || tracks.length === 0) {
      return (
        <ErrorFallback
          title={STRINGS.WE_DO_NOT_HAVE_AUDIOS_FOR}
          baniTitle={title}
          buttonPress={async () => {
            try {
              await trackAudioEvent("requestAudioLink", title || "unknown");
              await Linking.openURL("https://khalisfoundation.org");
            } catch (error) {
              // Fallback: try opening the URL again if first attempt fails
              try {
                await Linking.openURL("https://khalisfoundation.org");
              } catch (fallbackError) {
                // Silently handle error - user may have no browser/app to handle URL
                console.warn("Failed to open URL:", fallbackError);
              }
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
        tracks={tracks}
        onCloseTrackModal={onCloseTrackModal}
        addAndPlayTrack={addAndPlayTrack}
        stop={stop}
        isPlaying={isPlaying}
      />
    );
  }, [tracks, title, baniID, isPlaying]);

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
      handlePlayPause={handlePlayPause}
      progress={progress}
      handleSeek={handleSeek}
      isAudioEnabled={isAudioEnabled}
      title={title}
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
};

export default AudioPlayer;
