import { useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { exists, stat } from "react-native-fs";
import TrackPlayer, { usePlaybackState, useProgress, State, Event } from "react-native-track-player";
import { useSelector } from "react-redux";
import {
  addTrack,
  playTrack,
  pauseTrack,
  stopTrack,
  resetPlayer,
  TrackPlayerSetup,
  getTrackPlayerState,
  handlePlayerError,
  subscribeTrackPlayerState,
} from "@common/TrackPlayerUtils";
import { logError, logMessage, logNetworkError, useNetwork } from "@common";
import { formatUrlForTrackPlayer, isLocalFile } from "../../utils/urlHelper";
import {
  downloadAudioOnly,
  getFullPrefetchTrackPath,
  getFullLocalTrackPath,
  touchPrefetchTrack,
  prunePrefetchCache,
} from "../../utils/audioDownloader";

// Backoff schedule (ms) for connection-drop playback recovery — caps out at
// 30s so a sustained outage doesn't spin forever; the offline guard's pause
// takes over for that case anyway.
const RECOVERY_BACKOFF_MS = [1000, 2000, 4000, 8000, 15000, 30000];

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
  // When auto-download-on-stream is ON, the global engine saves a permanent copy
  // of whatever we stream — so the ephemeral prefetch below would download the
  // same file a second time. Skip it in that case.
  const autoDownloadOnStream = useSelector((state) => state.autoDownloadOnStream);
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
  // Connection-drop recovery (network handoff mid-stream, transient CDN error,
  // etc). ExoPlayer's HTTP connection dies for real when the OS swaps network
  // interfaces — that's a native PlaybackError, not something the NetInfo-based
  // offline guard can see. { active, track, position, attempt, timer }.
  const recoveryRef = useRef({ active: false, track: null, position: 0, attempt: 0, timer: null });
  // Timestamp of the last PlaybackError — lets the Stop/None ref-clearing
  // effect below tell "error knocked the player over" apart from "user/track
  // genuinely stopped", so recovery isn't sabotaged by its own side effects.
  const lastErrorAtRef = useRef(0);
  const { isOnline } = useNetwork();

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

  // The singleton forgets a player the native side has lost (task swiped away,
  // OS reclaimed the service). Mirroring that here is what makes the guards
  // below skip a player that is gone instead of calling into it, and lets the
  // next play set it up again.
  useEffect(() => subscribeTrackPlayerState(setIsInitialized), []);

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
    } else if (
      playbackState?.state === State.Stopped ||
      playbackState?.state === State.None
    ) {
      // If play() was explicitly called within the last 2000ms, ignore this
      // stale Stop/None event coming from the pre-play reset() command! Same
      // for a Stop/None that's really a PlaybackError in disguise (ExoPlayer's
      // connection died mid-stream) — recovery owns getting back to Playing,
      // so don't let this clear the user's intent out from under it.
      const recentlyErrored = Date.now() - lastErrorAtRef.current < 4000;
      if (
        Date.now() - explicitPlayTriggeredAtRef.current > 2000 &&
        !recentlyErrored &&
        !recoveryRef.current.active
      ) {
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
    if (!isInitialized || !isAudio || !isAudioFeatureOn) return;
    if (playbackState?.state !== State.Buffering) return;
    if (!wasPlayingBeforeBufferRef.current) return;

    const timer = setTimeout(() => {
      TrackPlayer.play().catch(() => {});
    }, 5000);

    return () => clearTimeout(timer);
  }, [isInitialized, isAudio, isAudioFeatureOn, playbackState?.state]);

  // ── Connection-drop recovery (Spotify/YT-Music style reconnect) ────────────
  // A genuine network-interface switch (mobile data <-> WiFi) kills ExoPlayer's
  // live HTTP connection — that surfaces as Event.PlaybackError, not a buffering
  // stall, so the Ready/Buffering watchdogs above never see it. We capture
  // where playback dropped and silently reload + reseek + resume, retrying with
  // backoff and instantly the moment connectivity is confirmed back.
  const clearRecoveryTimer = useCallback(() => {
    if (recoveryRef.current.timer) {
      clearTimeout(recoveryRef.current.timer);
      recoveryRef.current.timer = null;
    }
  }, []);

  const cancelRecovery = useCallback(() => {
    clearRecoveryTimer();
    recoveryRef.current = { active: false, track: null, position: 0, attempt: 0, timer: null };
  }, [clearRecoveryTimer]);

  const scheduleRecoveryRetry = useCallback(() => {
    const rec = recoveryRef.current;
    if (!rec.active) return;
    clearRecoveryTimer();
    if (rec.attempt >= RECOVERY_BACKOFF_MS.length) {
      logError("Playback recovery exhausted retries after connection loss");
      cancelRecovery();
      return;
    }
    const delay = RECOVERY_BACKOFF_MS[rec.attempt];
    rec.attempt += 1;
    // eslint-disable-next-line no-use-before-define
    rec.timer = setTimeout(() => attemptRecoveryRef.current(), delay);
  }, [clearRecoveryTimer, cancelRecovery]);

  const attemptRecovery = useCallback(async () => {
    const rec = recoveryRef.current;
    if (!rec.active || !rec.track) return;
    try {
      await TrackPlayer.reset();
      await addTrack(rec.track);
      await TrackPlayer.seekTo(rec.position);
      await playTrack();
      logMessage("Playback recovered after connection error");
      cancelRecovery();
    } catch (error) {
      handlePlayerError("recovering playback", error, { reportMissing: true });
      scheduleRecoveryRetry();
    }
  }, [cancelRecovery, scheduleRecoveryRetry]);

  // Stable ref so the setTimeout above (created inside scheduleRecoveryRetry)
  // always calls the latest attemptRecovery without re-creating timers.
  const attemptRecoveryRef = useRef(attemptRecovery);
  useEffect(() => { attemptRecoveryRef.current = attemptRecovery; }, [attemptRecovery]);

  useEffect(() => {
    if (!isInitialized) return undefined;

    const sub = TrackPlayer.addEventListener(Event.PlaybackError, async () => {
      lastErrorAtRef.current = Date.now();
      // Not actively playing (or user already paused/stopped on purpose) —
      // nothing to reconnect.
      if (!wasPlayingBeforeBufferRef.current) return;

      if (!recoveryRef.current.active) {
        const [activeTrack, prog] = await Promise.all([
          TrackPlayer.getActiveTrack().catch(() => null),
          TrackPlayer.getProgress().catch(() => null),
        ]);
        if (!activeTrack?.url) return;
        recoveryRef.current = {
          active: true,
          track: activeTrack,
          position: prog?.position ?? 0,
          attempt: 0,
          timer: null,
        };
      }
      scheduleRecoveryRetry();
    });

    return () => {
      sub.remove();
      clearRecoveryTimer();
    };
  }, [isInitialized, scheduleRecoveryRetry, clearRecoveryTimer]);

  // The instant real connectivity is confirmed back, retry immediately instead
  // of waiting out the current backoff delay — this is what makes the
  // reconnect feel instant rather than "eventually".
  const prevIsOnlineRef = useRef(isOnline);
  useEffect(() => {
    const cameOnline = isOnline && !prevIsOnlineRef.current;
    prevIsOnlineRef.current = isOnline;
    if (cameOnline && recoveryRef.current.active) {
      clearRecoveryTimer();
      attemptRecovery();
    }
  }, [isOnline, attemptRecovery, clearRecoveryTimer]);

  useEffect(() => {
    const teardownWhenFeatureDisabled = async () => {
      if (!isInitialized || isAudioFeatureOn) {
        return;
      }
      cancelRecovery();
      try {
        await stopTrack();
      } catch (_) {}
      try {
        await resetPlayer();
      } catch (_) {}
      currentTrackIdRef.current = null;
      setIsPlaying(false);
    };

    teardownWhenFeatureDisabled();
  }, [isInitialized, isAudioFeatureOn]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

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

        // Cache the prefetched track for quick seek without re-download churn.
        await touchPrefetchTrack(track.url);
        await prunePrefetchCache();

        return fullLocalPath;
      } catch (error) {
        logNetworkError(`Prefetch for seek failed: ${error?.message || error}`, error);
        return null;
      } finally {
        prefetchInFlightRef.current.delete(trackKey);
      }
    })();

    prefetchInFlightRef.current.set(trackKey, prefetchPromise);
    return prefetchPromise;
  }, []);

  const play = useCallback(async () => {
    if (!isAudio || !isAudioFeatureOn) {
      logMessage("Audio is disabled in settings");
      return;
    }
    // A player that was never set up, or was lost since, is set up again here
    // rather than the tap being dropped. configurePlayer reports its own failure.
    if (!isInitialized) {
      await configurePlayer();
      if (!getTrackPlayerState().isInitialized) return;
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
      handlePlayerError("playing track", error, { reportMissing: true });
    }
  }, [isInitialized, isAudio, isAudioFeatureOn, configurePlayer]);

  const pause = useCallback(async () => {
    // Explicit user intent — don't let a pending reconnect retry fight it.
    cancelRecovery();
    try {
      await pauseTrack();
    } catch (error) {
      handlePlayerError("pausing track", error);
    }
  }, []);

  const stop = useCallback(async () => {
    if (!isInitialized) return;
    cancelRecovery();
    try {
      await stopTrack();
    } catch (error) {
      handlePlayerError("stopping track", error);
    }
  }, [isInitialized]);

  const reset = useCallback(async () => {
    if (!isInitialized) return;
    cancelRecovery();
    try {
      await resetPlayer();
    } catch (error) {
      handlePlayerError("resetting player", error);
    }
  }, [isInitialized]);

  const seekTo = useCallback(async (position) => {
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
        const playbackStateNow = await TrackPlayer.getPlaybackState().catch(() => null);
        const wasPlaying =
          playbackStateNow?.state === State.Playing ||
          (playbackStateNow?.state === State.Buffering && wasPlayingBeforeBufferRef.current === true);

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
            if (await exists(fullDownloadedPath)) {
              const fileStat = await stat(fullDownloadedPath);
              if (expectedBytes <= 0 || Number(fileStat.size) >= expectedBytes * 0.9) {
                localPath = fullDownloadedPath;
              }
            }
            if (!localPath && (await exists(prefetchPath))) {
              const fileStat = await stat(prefetchPath);
              if (expectedBytes <= 0 || Number(fileStat.size) >= expectedBytes * 0.9) {
                localPath = prefetchPath;
                await touchPrefetchTrack(remoteUrl).catch(() => {});
              }
            }
          } catch (_) {
            // exists/stat failure is non-fatal; fall through to plain remote seek.
          }

          if (localPath) {
            try {

              const nativeProgressBeforeSwap = await TrackPlayer.getProgress().catch(() => null);
              const nativeDuration = Number(nativeProgressBeforeSwap?.duration);
              const metaDuration = Number(activeTrack?.duration);
              const knownDuration =
                Number.isFinite(nativeDuration) && nativeDuration > 0
                  ? nativeDuration
                  : Number.isFinite(metaDuration) && metaDuration > 0
                  ? metaDuration
                  : null;

              const maxSeekable = knownDuration != null ? Math.max(0, knownDuration - 0.5) : null;
              const safePosition =
                maxSeekable != null
                  ? Math.min(Math.max(0, targetPosition), maxSeekable)
                  : Math.max(0, targetPosition);

              // Reload with local file — this is fast (disk I/O, no network).
              await TrackPlayer.reset();
              await addTrack({
                ...activeTrack,
                url: formatUrlForTrackPlayer(localPath),
              });
              await TrackPlayer.seekTo(safePosition);
              if (wasPlaying) {
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

        // --- Original remote seek path (fallback or already-local track) ---
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

        await TrackPlayer.seekTo(safePosition);
        // Android (and occasionally iOS) transitions to Paused after seekTo
        // even when the track was playing before the seek. Auto-resume so the
        // user never has to spam the play button.
        if (wasPlaying) {
          await playTrack();
        }
      }
    } catch (error) {
      handlePlayerError("seeking to position", error);
    } finally {
      seekInFlightRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isAudio, isAudioFeatureOn]);

  const addAndPlayTrack = useCallback(async (
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

    // Loading a different track makes any in-flight reconnect for the old one
    // stale — drop it so recovery never reloads the wrong track underneath us.
    cancelRecovery();

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
          await prunePrefetchCache().catch(() => {});
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

      if (shouldPlay) {
        await play();
      }

      // ── Background prefetch (non-blocking) ──────────────────────────────
      // Start downloading immediately so the local copy is ready by the time
      // the user presses "Next" (preview → full player) or seeks.
      // With faststart M4A, streaming and downloading use separate HTTP
      // connections — no bandwidth starvation because the stream only needs
      // a tiny initial burst to fill the 1s playback buffer, then trickles.
      // Skipped when auto-download-on-stream is ON (a permanent copy is already
      // being saved by the global engine — no need to also prefetch).
      if (!isLocalFile(playbackUrl) && !autoDownloadOnStream) {
        prefetchForSeek({
          id,
          url: playbackUrl,
          title,
          artist,
        });
      }
    } catch (error) {
      handlePlayerError("adding and playing track", error, { reportMissing: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isAudio, isAudioFeatureOn, reset, play, prefetchForSeek]);

  const setRate = useCallback(async (rate) => {
    if (!isInitialized) {
      logMessage("Audio is not initialized");
      return;
    }
    try {
      await TrackPlayer.setRate(rate);
    } catch (error) {
      handlePlayerError("setting playback rate", error);
    }
  }, [isInitialized]);

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
