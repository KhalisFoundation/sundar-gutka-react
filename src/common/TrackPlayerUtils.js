import { AppState } from "react-native";
import { logError, logMessage } from "./index";

// Resolves once the app is in the foreground. setupPlayer() starts the RNTP
// MusicService as a foreground service, and Android 12+ throws
// ForegroundServiceStartNotAllowedException if that happens from the background
// (e.g. the player mounts while the activity is stopping). Gating setup on this
// is the single chokepoint that protects every caller.
const waitForForeground = () =>
  new Promise((resolve) => {
    if (AppState.currentState === "active") {
      resolve();
      return;
    }
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        sub.remove();
        resolve();
      }
    });
  });

// RNTP is required lazily (not at module load time) because its Capability.js
// initialiser reads NativeModules.TrackPlayerModule at the moment the module
// evaluates. When the native module is null (stale APK / hot-reload mismatch)
// that IIFE throws and prevents AppRegistry.registerComponent from ever running,
// crashing the entire app before it starts.
let _rntp = null;
const loadRNTP = () => {
  if (!_rntp) {
    _rntp = require("react-native-track-player"); // eslint-disable-line
  }
  return _rntp;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// What the native module answers with, on both platforms, whenever its service
// connection is gone: never set up, or set up and since lost (the task swiped
// away under StopPlaybackAndRemoveNotification, the OS reclaiming the service).
// Android rejects with this from verifyServiceBoundOrReject on every call; iOS
// from RNTrackPlayer.swift. setupPlayer binds again in that state.
const NOT_INITIALIZED_CODE = "player_not_initialized";
const isNotInitialized = (error) =>
  error?.code === NOT_INITIALIZED_CODE || /not initialized/i.test(String(error?.message ?? ""));

// RNTP's own native foreground check (AppForegroundTracker) is a separate
// Activity-lifecycle observer from RN's AppState module, so it can still lag
// a beat behind — waitForForeground() can resolve a moment before the native
// side agrees the app is foreground. Bounded retry below absorbs that gap
// instead of stranding the player in a deferred state until the user
// manually retries.
const MAX_SETUP_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

// Singleton service to manage TrackPlayer initialization
class TrackPlayerService {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null;
    this.activeListeners = new Set();
    this.subscribers = new Set();
  }

  setInitialized(value) {
    if (this.isInitialized === value) return;
    this.isInitialized = value;
    this.subscribers.forEach((listener) => listener(value));
  }

  subscribe(listener) {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  async initialize() {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized) {
      return Promise.resolve();
    }

    // Create initialization promise
    this.initPromise = (async () => {
      try {
        await this._setupWithRetry();
        this.setInitialized(true);
        logMessage("TrackPlayer service initialized successfully");
      } catch (error) {
        if (
          error?.message?.includes("already initialized") ||
          error?.code === "player_already_initialized"
        ) {
          this.setInitialized(true);
          logMessage("TrackPlayer already initialized");
        } else if (
          error?.code === "android_cannot_setup_player_in_background" ||
          error?.message?.includes("must be in the foreground")
        ) {
          // Still backgrounded after every retry — genuinely defer; the next
          // manual retry (or app.js's own foreground-triggered setup) will
          // pick this back up.
          this.setInitialized(false);
          logMessage(
            `TrackPlayer setup deferred (foreground service not allowed): ${error?.message}`,
          );
        } else {
          logError(`TrackPlayer initialization failed: ${error?.message || "Unknown error"}`);
          this.setInitialized(false);
          throw error;
        }
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  async _setupWithRetry(attempt = 1) {
    // Never start the player's foreground service from the background —
    // wait until the app is foreground first (Android 12+ FGS restriction).
    await waitForForeground();

    logMessage("Initializing TrackPlayer service...");

    // Resolve RNTP lazily here — by the time initialize() is called the
    // native module is guaranteed to be registered by the Android runtime.
    const TrackPlayer = loadRNTP().default;
    const { Capability, RepeatMode, AppKilledPlaybackBehavior } = loadRNTP();

    try {
      await TrackPlayer.setupPlayer({
        // waitForBuffer: true makes ExoPlayer/AVPlayer pause (transition to
        // Buffering state) when the stream buffer runs dry, instead of silently
        // advancing the position counter with no audio output. The auto-resume
        // watchdog in useTrackPlayer handles recovery when the buffer refills.
        // Combined with playbackBuffer: 1, initial playback starts after just
        // 1 second of buffering — fast enough for good UX.
        waitForBuffer: true,
        maxCacheSize: 51200, // 50 MB ExoPlayer cache
        minBuffer: 5, // Android: keep ≥5s buffered ahead
        maxBuffer: 30, // Android: buffer up to 30s ahead
        backBuffer: 0, // Android: no back-buffer (saves memory)
        playbackBuffer: 1, // Android: start playing once 1s is buffered
        iosCategory: "playback",
      });
    } catch (error) {
      const isForegroundRace =
        error?.code === "android_cannot_setup_player_in_background" ||
        error?.message?.includes("must be in the foreground");
      if (isForegroundRace && attempt < MAX_SETUP_ATTEMPTS) {
        // Native's own foreground tracker hadn't caught up with RN's AppState
        // yet — give it a beat and try again rather than stranding the player.
        logMessage(
          `TrackPlayer setup hit the foreground race (attempt ${attempt}/${MAX_SETUP_ATTEMPTS}), retrying...`,
        );
        await delay(RETRY_DELAY_MS);
        return this._setupWithRetry(attempt + 1);
      }
      throw error;
    }

    await TrackPlayer.setRepeatMode(RepeatMode.Off);

    await TrackPlayer.updateOptions({
      // Fewer progress events -> less UI/notification churn on low-end devices.
      progressUpdateEventInterval: 2,
      // Small icon shown in Android notification (RNTP v4 expects a JS map with a uri field)
      icon: { uri: "ic_notification" },
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        notificationChannelName: "Sundar Gutka Playback V4",
        notificationChannelDescription: "Gurbani audio playback controls",
        notificationColor: 0xffeeb14f,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
    });
  }

  // The flag only says what THIS side did; the native service can go away
  // underneath it (see NOT_INITIALIZED_CODE). Forgetting it here is what lets
  // the next initialize() bind again instead of being skipped as already done.
  markLost() {
    if (this.isInitialized) {
      logMessage("TrackPlayer service connection lost; will set up again on next use");
    }
    this.setInitialized(false);
  }

  async cleanup() {
    try {
      logMessage("Cleaning up TrackPlayer service...");

      const TrackPlayer = loadRNTP().default;
      await TrackPlayer.stop();
      await TrackPlayer.reset();

      this.setInitialized(false);
      logMessage("TrackPlayer service cleaned up successfully");
    } catch (error) {
      if (isNotInitialized(error)) {
        this.markLost();
        return;
      }
      logError(`TrackPlayer cleanup failed: ${error?.message || "Unknown error"}`);
    }
  }

  getState() {
    return {
      isInitialized: this.isInitialized,
    };
  }
}

// Export singleton instance
const trackPlayerService = new TrackPlayerService();

export const TrackPlayerSetup = async () => {
  return trackPlayerService.initialize();
};

export const TrackPlayerCleanup = async () => {
  return trackPlayerService.cleanup();
};

export const getTrackPlayerState = () => {
  return trackPlayerService.getState();
};

/** Calls `listener(isInitialized)` whenever the player is set up or lost. */
export const subscribeTrackPlayerState = (listener) => trackPlayerService.subscribe(listener);

/**
 * The one place a failed player call is judged. A player that is not there
 * (never set up, or lost since — see NOT_INITIALIZED_CODE) is forgotten so the
 * next setup binds again, and is reported only when the caller says a missing
 * player is worth reporting; anything else is an error.
 *
 * @param {string} label what was being attempted, e.g. "pausing track"
 * @param {unknown} error what the player threw
 * @param {{ reportMissing?: boolean }} [options]
 * @returns {boolean} true when the failure was a missing player
 */
export const handlePlayerError = (label, error, { reportMissing = false } = {}) => {
  const missing = isNotInitialized(error);
  if (missing) trackPlayerService.markLost();
  if (!missing || reportMissing) logError(`Error ${label}: ${error}`);
  return missing;
};

// Every player call goes through here, so "there is no player" is handled
// once. A call that only makes sense WITH a player — pause, stop, reset — is
// skipped while there is none: the focus-loss hook, the tab bar and the
// offline guard all pause "whatever is playing", and in a session that never
// touched audio nothing is. Those calls used to reach native anyway and log
// player_not_initialized on every background transition, the most frequent
// Crashlytics non-fatal of the 6.0.0 rollout. A player that was set up and has
// since been lost answers the same way; that resets the flag so the next
// setup binds again, and is not an error either. Anything else is.
const withPlayer = async (label, action, { requiresPlayer = true } = {}) => {
  if (requiresPlayer && !trackPlayerService.isInitialized) return;
  try {
    await action(loadRNTP().default);
  } catch (error) {
    handlePlayerError(label, error, { reportMissing: !requiresPlayer });
  }
};

export const addTrack = async (track) => {
  try {
    // Validate track object
    if (!track.url) {
      logError("Track URL is missing or empty");
      throw new Error("Track URL is missing or empty");
    }
    if (!track.id) {
      logError("Track ID is missing");
    }

    const TrackPlayer = loadRNTP().default;
    await TrackPlayer.add(track);
  } catch (error) {
    if (isNotInitialized(error)) trackPlayerService.markLost();
    logError(`❌ Error adding track to TrackPlayer: ${error}`);
    throw error; // Re-throw to handle upstream
  }
};

// Play is the one call the user is waiting on, so it is attempted regardless
// and a missing player IS reported — after resetting the flag, so the retry
// path sets the player up again rather than assuming it is there.
export const playTrack = () =>
  withPlayer("playing track", (player) => player.play(), { requiresPlayer: false });

export const pauseTrack = () => withPlayer("pausing track", (player) => player.pause());

export const stopTrack = () => withPlayer("stopping track", (player) => player.stop());

export const resetPlayer = () => withPlayer("resetting player", (player) => player.reset());
