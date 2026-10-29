const TrackPlayer = require("react-native-track-player").default;
const { Event, State } = require("react-native-track-player");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;
const { Platform } = require("react-native");

/**
 * Background Playback Service (RNTP v4)
 *
 * Handles OS/hardware events: lock-screen controls, headphones, Bluetooth,
 * Android notification actions, phone calls, alarms.
 *
 * Call/alarm interruption logic:
 *  - Autoplay OFF → pause on interrupt, stay paused forever.
 *  - Autoplay ON  → pause on interrupt, auto-resume when interrupt ends.
 *  - Notification volume duck → OS handles volume dip natively, no pause.
 */
module.exports = async function () {
  let shouldResumeAfterDuck = false;

  const getIsAutoPlay = async () => {
    try {
      const rawState = await AsyncStorage.getItem("persist:root");
      if (rawState) {
        const state = JSON.parse(rawState);
        return JSON.parse(state.isAudioAutoPlay || "false");
      }
    } catch (e) {
      console.error("Failed to read autoplay pref", e);
    }
    return false;
  };

  const safeStopAndReset = async () => {
    try {
      await TrackPlayer.pause();
    } catch (_) {}
    try {
      await TrackPlayer.stop();
    } catch (_) {}
    try {
      await TrackPlayer.reset();
    } catch (_) {}
    shouldResumeAfterDuck = false;
  };

  // ── Remote control / notification actions ──────────────────────────────────
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, safeStopAndReset);

  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position));

  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext().catch(() => {}));

  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    TrackPlayer.skipToPrevious().catch(() => {}),
  );

  // ── Audio focus / call & alarm interruptions ───────────────────────────────
  //
  // RemoteDuck fires for ALL audio focus changes:
  //  • permanent=true          → another app took audio (Spotify, YouTube)
  //  • permanent=false, paused → transient loss (phone call, alarm)
  //  • permanent=false, !paused→ focus regained (call/alarm ended)
  //
  // Notification sound ducks do NOT fire paused=true — the OS just lowers
  // volume briefly and restores it. We don't need to handle that case.
  TrackPlayer.addEventListener(Event.RemoteDuck, async ({ paused, permanent }) => {
    if (permanent) {
      // Another app took audio permanently. Stay paused, never auto-resume.
      shouldResumeAfterDuck = false;
      await TrackPlayer.pause().catch(() => {});
      return;
    }

    if (paused) {
      // Call/alarm arrived. Check if we should resume when it ends.
      shouldResumeAfterDuck = false;

      try {
        const [playbackState, isAutoPlay] = await Promise.all([
          TrackPlayer.getPlaybackState(),
          getIsAutoPlay(),
        ]);

        const currentState = playbackState?.state ?? playbackState;
        const wasPlaying = currentState === State.Playing || currentState === State.Buffering;

        // Resume after interrupt ONLY if autoplay is ON AND audio was playing.
        shouldResumeAfterDuck = isAutoPlay && wasPlaying;
      } catch (_) {
        shouldResumeAfterDuck = false;
      }

      await TrackPlayer.pause().catch(() => {});
      return;
    }

    // Focus regained — call/alarm ended.
    if (shouldResumeAfterDuck) {
      shouldResumeAfterDuck = false;
      // Brief delay so the OS audio session is fully restored on all OEMs.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await TrackPlayer.play().catch(() => {});
    }
  });

  // ── iOS Control Center / Lock Screen fix ────────────────────────────────────
  //
  // On iOS, the MPNowPlayingInfoCenter determines the play/pause button state
  // from the `playbackRate` in NowPlayingInfo. After a reset→add→play sequence,
  // the rate can get stuck at 0 because:
  //   1. reset() clears NowPlayingInfo and deactivates the audio session
  //   2. add() fires with playWhenReady=false, so playbackRate is set to 0
  //   3. play() sets playWhenReady=true, but the audio session may not be
  //      fully re-activated yet, causing iOS to ignore the rate update
  //
  // TrackPlayer.setRate() does NOT update NowPlayingInfo — it only sets the
  // internal AVPlayer rate. To fix this, we use the custom NowPlayingHelper
  // native module (ios/NowPlayingHelper.swift) which directly writes
  // playbackRate to MPNowPlayingInfoCenter.default().nowPlayingInfo.
  //
  // On iPad, the audio session reactivation takes much longer than iPhone,
  // so we poll every 600ms for up to ~5 seconds to guarantee the sync.
  if (Platform.OS === "ios") {
    const { NativeModules } = require("react-native");
    const NowPlayingHelper = NativeModules.NowPlayingHelper;
    let rateSyncTimer = null;

    const forceRateNow = async () => {
      try {
        const playbackState = await TrackPlayer.getPlaybackState().catch(() => null);
        const currentState = playbackState?.state ?? playbackState;
        if (currentState !== State.Playing) return;
        const currentRate = await TrackPlayer.getRate().catch(() => 1);
        if (NowPlayingHelper) {
          NowPlayingHelper.forcePlaybackRate(currentRate);
        }
      } catch (_) {
        // Non-critical — the polling backstop will retry.
      }
    };

    const startRateSyncPolling = () => {
      if (rateSyncTimer) {
        clearInterval(rateSyncTimer);
        rateSyncTimer = null;
      }

      // Force immediately so the widget reflects Playing without waiting
      // for the first 600ms tick. The interval below stays as a backstop
      // for the iPad audio-session reactivation race.
      forceRateNow();

      let attempts = 0;
      const MAX_ATTEMPTS = 8; // 8 × 600ms = ~5 seconds
      const INTERVAL_MS = 600;

      rateSyncTimer = setInterval(async () => {
        attempts += 1;

        try {
          const playbackState = await TrackPlayer.getPlaybackState().catch(() => null);
          const currentState = playbackState?.state ?? playbackState;

          // Stop if user paused/stopped — don't overwrite their intent.
          if (currentState !== State.Playing) {
            clearInterval(rateSyncTimer);
            rateSyncTimer = null;
            return;
          }

          const currentRate = await TrackPlayer.getRate().catch(() => 1);
          // Directly set playbackRate on MPNowPlayingInfoCenter via native module.
          // This is what actually makes the Control Center show the pause button.
          if (NowPlayingHelper) {
            NowPlayingHelper.forcePlaybackRate(currentRate);
          }
        } catch (_) {
          // Non-critical — next iteration will retry.
        }

        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(rateSyncTimer);
          rateSyncTimer = null;
        }
      }, INTERVAL_MS);
    };

    TrackPlayer.addEventListener(Event.PlaybackState, ({ state }) => {
      if (state === State.Playing) {
        startRateSyncPolling();
      } else if (rateSyncTimer) {
        clearInterval(rateSyncTimer);
        rateSyncTimer = null;
      }
    });
  }

  // ── Playback lifecycle ──────────────────────────────────────────────────────
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async ({ track }) => {
    if (track != null) {
      await safeStopAndReset();
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackError, ({ code, message }) => {
    console.error("[TrackPlayer] Playback error:", code, message);
  });
};
