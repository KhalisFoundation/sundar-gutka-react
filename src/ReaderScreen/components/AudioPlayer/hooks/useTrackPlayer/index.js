import { useState, useEffect, useCallback, useRef } from "react";
import { exists, stat } from "react-native-fs";
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
  RepeatMode,
} from "react-native-track-player";
import { useSelector } from "react-redux";
import {
  addTrack,
  playTrack,
  pauseTrack,
  stopTrack,
  resetPlayer,
  TrackPlayerSetup,
  getTrackPlayerState,
} from "@common/TrackPlayerUtils";
import { logError, logMessage } from "@common";
import {
  downloadAudioOnly,
  getFullPrefetchTrackPath,
  getFullLocalTrackPath,
  touchPrefetchTrack,
  prunePrefetchCache,
} from "../../utils/audioDownloader";
import { formatUrlForTrackPlayer, isLocalFile } from "../../utils/urlHelper";

const useTrackPlayer = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState(null);
  const playbackState = usePlaybackState();
  const progress = useProgress(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const isAudio = useSelector((state) => state.isAudio);
  const isAudioFeatureEnabled = useSelector((state) => state.isAudioFeatureEnabled);
  const isAudioFeatureOn = isAudioFeatureEnabled ?? true;
  const isAudioLoopPlayback = useSelector((state) => state.isAudioLoopPlayback);
  const progressRef = useRef(progress);
  const currentTrackIdRef = useRef(null);
  const prefetchInFlightRef = useRef(new Map());
  const seekInFlightRef = useRef(false);
  const pendingSeekRef = useRef(null);
  // When addAndPlayTrack is called by handleTrackSelect, this ref is set to
  // true so that AudioControlBar's loadActiveTrack effect skips re-loading
  // the same track (avoiding the destructive reset→add→reset→add race that
  // kills mid-buffer M4A moov parsing).
  const skipNextLoadRef = useRef(false);
  // Tracks whether the user had an active play session before a buffer stall.
  // Used by the auto-resume logic to distinguish a mid-play stall from an
  // intentional pause/stop.
  const wasPlayingBeforeBufferRef = useRef(false);

  const configurePlayer = useCallback(async () => {
    setInitializationError(null);
    setIsInitializing(true);
    try {
      // Use singleton service for initialization
      await TrackPlayerSetup();

      // Check state from singleton
      const state = getTrackPlayerState();
      setIsInitialized(state.isInitialized);
    } catch (error) {
      logError("Error initializing TrackPlayer:", error);
      setIsInitialized(false);
      setInitializationError(error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const retryInitialization = useCallback(async () => {
    if (isInitializing) {
      return;
    }
    await configurePlayer();
  }, [configurePlayer, isInitializing]);

  useEffect(() => {
    (async () => {
      await configurePlayer();
    })();
  }, [configurePlayer]);

  useEffect(() => {
    if (!isInitialized) return;
    setIsPlaying(playbackState?.state === State.Playing);
  }, [playbackState, isInitialized]);

  // Track play/stop transitions so the auto-resume knows when a stall is
  // mid-playback vs. an intentional pause. We use a timestamp to prevent
  // stale native bridge events from overwriting the user's intent.
  const explicitPlayTriggeredAtRef = useRef(0);

  useEffect(() => {
    if (playbackState?.state === State.Playing) {
      wasPlayingBeforeBufferRef.current = true;
    } else if (playbackState?.state === State.Paused) {
      wasPlayingBeforeBufferRef.current = false;
    } else if (playbackState?.state === State.Stopped || playbackState?.state === State.None) {
      // If play() was explicitly called within the last 2000ms, ignore this
      // stale Stop/None event coming from the pre-play reset() command!
      if (Date.now() - explicitPlayTriggeredAtRef.current > 2000) {
        wasPlayingBeforeBufferRef.current = false;
      }
    }
  }, [playbackState?.state]);

  // Auto-resume: when the buffer refills (State.Ready after a stall) and the
  // user was playing before, immediately kick the player back into Playing.
  // This is the primary recovery path — instant, no delay.
  useEffect(() => {
    if (!isInitialized || !isAudio || !isAudioFeatureOn) return;
    if (playbackState?.state !== State.Ready) return;
    if (!wasPlayingBeforeBufferRef.current) return; // don't auto-play on initial load

    TrackPlayer.play().catch(() => {});
  }, [isInitialized, isAudio, isAudioFeatureOn, playbackState?.state]);

  // Hard-fallback watchdog: if the player stays in State.Buffering for 5s
  // without transitioning to State.Ready, kick it anyway. Covers edge cases
  // where the state machine doesn't emit Ready (can happen on some Android OEMs).
  // NOTE: 5000ms (not 500ms) because M4A containers require multi-second moov
  // atom parsing before ExoPlayer can begin buffering audio data. A 500ms
  // watchdog fires during initial load and interferes with the state machine.
  useEffect(() => {
    if (!isInitialized || !isAudio || !isAudioFeatureOn) return undefined;
    if (playbackState?.state !== State.Buffering) return undefined;
    if (!wasPlayingBeforeBufferRef.current) return undefined;

    const timer = setTimeout(() => {
      TrackPlayer.play().catch(() => {});
    }, 5000);

    return () => clearTimeout(timer);
  }, [isInitialized, isAudio, isAudioFeatureOn, playbackState?.state]);

  useEffect(() => {
    const teardownWhenFeatureDisabled = async () => {
      if (!isInitialized || isAudioFeatureOn) {
        return;
      }
      try {
        await stopTrack();
      } catch (_e) {
        /* intentional no-op */
      }
      try {
        await resetPlayer();
      } catch (_e) {
        /* intentional no-op */
      }
      currentTrackIdRef.current = null;
      setIsPlaying(false);
    };

    teardownWhenFeatureDisabled();
  }, [isInitialized, isAudioFeatureOn]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!isInitialized) return;
    TrackPlayer.setRepeatMode(isAudioLoopPlayback ? RepeatMode.Track : RepeatMode.Off).catch(
      () => {}
    );
  }, [isInitialized, isAudioLoopPlayback]);

  const prefetchForSeek = useCallback(async (track) => {
    if (!track?.id || !track?.url || isLocalFile(track.url)) return null;

    const trackKey = String(track.id);
    if (prefetchInFlightRef.current.has(trackKey)) {
      return prefetchInFlightRef.current.get(trackKey);
    }

    const prefetchPromise = (async () => {
      try {
        const fullLocalPath = getFullPrefetchTrackPath(track.url);
        const alreadyExists = await exists(fullLocalPath);
        if (!alreadyExists) {
          await downloadAudioOnly(track.url, track.title || track.artist || "Track", {
            targetDirectory: "prefetch",
          });
        }

        const ready = await exists(fullLocalPath);
        if (!ready) return null;

        // Keep last 5 prefetched tracks for quick seek without re-download churn.
        await touchPrefetchTrack(track.url);
        await prunePrefetchCache(5);

        return fullLocalPath;
      } catch (error) {
        logError("Prefetch for seek failed:", error);
        return null;
      } finally {
        prefetchInFlightRef.current.delete(trackKey);
      }
    })();

    prefetchInFlightRef.current.set(trackKey, prefetchPromise);
    return prefetchPromise;
  }, []);

  const play = async () => {
    if (!isInitialized || !isAudio || !isAudioFeatureOn) {
      logMessage("Audio is not initialized or disabled in settings");
      return;
    }
    try {
      explicitPlayTriggeredAtRef.current = Date.now();
      // Record user intent instantly. This ensures that when the stream completes
      // its initial buffering and transitions to State.Ready, our auto-resume
      // logic guarantees it kicks into State.Playing instead of stalling.
      wasPlayingBeforeBufferRef.current = true;
      await playTrack();
      // NOTE: iOS Control Center play/pause state sync is handled by the
      // polling retry in TrackPlayerService.js (Event.PlaybackState listener).
      // No inline setRate() call needed here.
    } catch (error) {
      logError("Error playing track:", error);
    }
  };

  const pause = async () => {
    try {
      await pauseTrack();
    } catch (error) {
      logError("Error pausing track:", error);
    }
  };

  const stop = async () => {
    if (!isInitialized) return;
    try {
      await stopTrack();
    } catch (error) {
      logError("Error stopping track:", error);
    }
  };

  const reset = async () => {
    if (!isInitialized) return;
    try {
      await resetPlayer();
    } catch (error) {
      logError("Error resetting player:", error);
    }
  };

  const seekTo = async (position) => {
    if (!isInitialized || !isAudio || !isAudioFeatureOn) {
      logMessage("Audio is not initialized or disabled in settings");
      return;
    }

    const numericPosition = Number(position);
    if (!Number.isFinite(numericPosition) || numericPosition < 0) {
      return;
    }

    pendingSeekRef.current = numericPosition;
    if (seekInFlightRef.current) {
      return;
    }

    seekInFlightRef.current = true;

    try {
      while (pendingSeekRef.current != null) {
        const targetPosition = pendingSeekRef.current;
        pendingSeekRef.current = null;

        // Capture playing state via native API (React state is stale in async).
        // Used by both seek paths to auto-resume after the seek settles.
        // eslint-disable-next-line no-await-in-loop
        const playbackStateNow = await TrackPlayer.getPlaybackState().catch(() => null);
        const wasPlaying =
          playbackStateNow?.state === State.Playing ||
          (playbackStateNow?.state === State.Buffering &&
            wasPlayingBeforeBufferRef.current === true);

        // eslint-disable-next-line no-await-in-loop
        const activeTrack = await TrackPlayer.getActiveTrack();
        if (!activeTrack) {
          return;
        }

        // --- Fast-seek: reload from a local copy when streaming from remote ---
        // Seeking in a remote HTTP stream triggers buffering (~30s delay).
        // If the full downloaded file or the background-prefetch file already
        // exists on disk, silently swap to it and seek locally instead.
        if (activeTrack?.url && !isLocalFile(activeTrack.url)) {
          const remoteUrl = activeTrack.url;

          // Priority 1: user-explicitly-downloaded copy (permanent, full quality)
          const fullDownloadedPath = getFullLocalTrackPath(remoteUrl);
          // Priority 2: background prefetch copy (temporary LRU cache)
          const prefetchPath = getFullPrefetchTrackPath(remoteUrl);
          const expectedBytes = (activeTrack.trackSizeMB || 0) * 1024 * 1024;

          let localPath = null;
          try {
            // eslint-disable-next-line no-await-in-loop
            if (await exists(fullDownloadedPath)) {
              // eslint-disable-next-line no-await-in-loop
              const fileStat = await stat(fullDownloadedPath);
              if (expectedBytes <= 0 || Number(fileStat.size) >= expectedBytes * 0.9) {
                localPath = fullDownloadedPath;
              }
            }
            // eslint-disable-next-line no-await-in-loop
            if (!localPath && (await exists(prefetchPath))) {
              // eslint-disable-next-line no-await-in-loop
              const fileStat = await stat(prefetchPath);
              if (expectedBytes <= 0 || Number(fileStat.size) >= expectedBytes * 0.9) {
                localPath = prefetchPath;
                // eslint-disable-next-line no-await-in-loop
                await touchPrefetchTrack(remoteUrl).catch(() => {});
              }
            }
          } catch (_e) {
            // exists/stat failure is non-fatal; fall through to plain remote seek.
          }

          if (localPath) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const nativeProgressBeforeSwap = await TrackPlayer.getProgress().catch(() => null);
              const nativeDuration = Number(nativeProgressBeforeSwap?.duration);
              const metaDuration = Number(activeTrack?.duration);
              let knownDuration;
              if (Number.isFinite(nativeDuration) && nativeDuration > 0) {
                knownDuration = nativeDuration;
              } else if (Number.isFinite(metaDuration) && metaDuration > 0) {
                knownDuration = metaDuration;
              } else {
                knownDuration = null;
              }
              const maxSeekable = knownDuration != null ? Math.max(0, knownDuration - 0.5) : null;
              const safePosition =
                maxSeekable != null
                  ? Math.min(Math.max(0, targetPosition), maxSeekable)
                  : Math.max(0, targetPosition);

              // Reload with local file — this is fast (disk I/O, no network).
              // eslint-disable-next-line no-await-in-loop
              await TrackPlayer.reset();
              // eslint-disable-next-line no-await-in-loop
              await addTrack({
                ...activeTrack,
                url: formatUrlForTrackPlayer(localPath),
              });
              // eslint-disable-next-line no-await-in-loop
              await TrackPlayer.seekTo(safePosition);
              if (wasPlaying) {
                // eslint-disable-next-line no-await-in-loop
                await playTrack();
              }
              // Update the ref so subsequent operations know the track is local.
              currentTrackIdRef.current = activeTrack.id;
              return;
            } catch (swapError) {
              logError("Fast-seek local swap failed, falling back to remote seek:", swapError);
              // Fall through to the original remote seekTo path below.
            }
          }

          // No local copy yet — kick off a background prefetch so future seeks
          // are instant, but don't block the current seek on it.
          prefetchForSeek({
            ...activeTrack,
            id: activeTrack.id,
            url: activeTrack.url,
            title: activeTrack.title,
            artist: activeTrack.artist,
          });
        }

        // eslint-disable-next-line no-await-in-loop
        const nativeProgress = await TrackPlayer.getProgress().catch(() => null);

        const nativeDuration = Number(nativeProgress?.duration);
        const runtimeDuration = Number(progressRef.current?.duration);
        const metadataDuration = Number(activeTrack?.duration);

        let knownDuration = null;
        if (Number.isFinite(nativeDuration) && nativeDuration > 0) {
          knownDuration = nativeDuration;
        } else if (Number.isFinite(runtimeDuration) && runtimeDuration > 0) {
          knownDuration = runtimeDuration;
        } else if (Number.isFinite(metadataDuration) && metadataDuration > 0) {
          knownDuration = metadataDuration;
        }

        const maxSeekable = knownDuration != null ? Math.max(0, knownDuration - 0.5) : null;
        const safePosition =
          maxSeekable != null
            ? Math.min(Math.max(0, targetPosition), maxSeekable)
            : Math.max(0, targetPosition);

        // eslint-disable-next-line no-await-in-loop
        await TrackPlayer.seekTo(safePosition);
        // Android (and occasionally iOS) transitions to Paused after seekTo
        // even when the track was playing before the seek. Auto-resume so the
        // user never has to spam the play button.
        if (wasPlaying) {
          // eslint-disable-next-line no-await-in-loop
          await playTrack();
        }
      }
    } catch (error) {
      logError("Error seeking to position:", error);
    } finally {
      seekInFlightRef.current = false;
    }
  };

  const addAndPlayTrack = async (
    id,
    url,
    title,
    artist,
    lyricsUrl,
    trackLengthSec,
    trackSizeMB,
    shouldPlay = true,
    fallbackUrl = null
  ) => {
    if (!isInitialized || !isAudio || !isAudioFeatureOn) {
      logMessage("Audio is not initialized or disabled in settings");
      return;
    }

    try {
      let playbackUrl = url;

      // If pointing to a local file, verify it exists; otherwise fall back to remote URL when provided
      if (isLocalFile(url)) {
        const filePath = url.startsWith("file://") ? url.replace(/^file:\/\//, "") : url;
        const fileExists = await exists(filePath);
        if (!fileExists) {
          if (fallbackUrl) {
            playbackUrl = fallbackUrl;
          } else {
            logMessage("Local audio missing and no fallback URL available");
            return;
          }
        }
      }

      // ── URL resolution: local cache → prefetch cache → stream ──────────
      // M4A files have faststart (moov atom at front), so HTTP streaming
      // works with a single request — no range-request negotiation needed.
      // Local playback is still preferred (instant seek, zero network).
      if (!isLocalFile(playbackUrl)) {
        const prefetchPath = getFullPrefetchTrackPath(playbackUrl);
        let hasCachedCopy = false;

        try {
          hasCachedCopy = await exists(prefetchPath);
          if (hasCachedCopy && trackSizeMB > 0) {
            const prefetchStat = await stat(prefetchPath);
            hasCachedCopy = Number(prefetchStat.size) >= trackSizeMB * 1024 * 1024 * 0.9;
          }
        } catch (_) {
          hasCachedCopy = false;
        }

        if (hasCachedCopy) {
          playbackUrl = prefetchPath;
          await touchPrefetchTrack(url).catch(() => {});
          await prunePrefetchCache(5).catch(() => {});
        }
      }

      // Determine MIME type so ExoPlayer skips format sniffing.
      const isM4A = /\.m4a(\?|$)/i.test(playbackUrl) || /\.m4a(\?|$)/i.test(url);

      const track = {
        id,
        url: formatUrlForTrackPlayer(playbackUrl),
        // Canonical remote URL — may differ from url when prefetch/download resolved
        // a local copy. Used by AudioControlBar to reliably detect same-track across
        // focus changes even when the resolved playback URL has changed.
        remoteUrl: fallbackUrl || url,
        title,
        artist,
        artwork: require("../../../../../../images/sundar_gutka_icon.png"),
        duration: trackLengthSec, // RNTP reads 'duration' — enables instant slider + seek
        lyricsUrl,
        trackSizeMB,
        ...(isM4A ? { contentType: "audio/mp4" } : {}),
      };

      currentTrackIdRef.current = id;

      // Signal that this addAndPlayTrack invocation is loading the track,
      // so AudioControlBar's loadActiveTrack effect should NOT re-trigger.
      skipNextLoadRef.current = true;

      await reset();
      await addTrack(track);
      await TrackPlayer.setRepeatMode(
        isAudioLoopPlayback ? RepeatMode.Track : RepeatMode.Off
      ).catch(() => {});

      if (shouldPlay) {
        await play();
      }

      // ── Background prefetch (non-blocking) ──────────────────────────────
      // Start downloading immediately so the local copy is ready by the time
      // the user presses "Next" (preview → full player) or seeks.
      // With faststart M4A, streaming and downloading use separate HTTP
      // connections — no bandwidth starvation because the stream only needs
      // a tiny initial burst to fill the 1s playback buffer, then trickles.
      if (!isLocalFile(playbackUrl)) {
        prefetchForSeek({
          id,
          url: playbackUrl,
          title,
          artist,
        });
      }
    } catch (error) {
      logError("Error adding and playing track:", error);
    }
  };

  const setRate = async (rate) => {
    if (!isInitialized) {
      logMessage("Audio is not initialized");
      return;
    }
    try {
      await TrackPlayer.setRate(rate);
    } catch (error) {
      logError("Error setting playback rate:", error);
    }
  };

  return {
    isPlaying,
    isBuffering: playbackState?.state === State.Buffering,
    playbackState,
    progress,
    play,
    pause,
    stop,
    reset,
    addAndPlayTrack,
    seekTo,
    setRate,
    isAudioEnabled: isAudio && isInitialized && isAudioFeatureOn,
    isInitialized,
    setIsPlaying,
    isInitializing,
    initializationError,
    retryInitialization,
    skipNextLoadRef,
  };
};

export default useTrackPlayer;
