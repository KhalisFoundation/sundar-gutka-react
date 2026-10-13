import {
  logEvent,
  getAnalytics,
  setAnalyticsCollectionEnabled,
} from "@react-native-firebase/analytics";
import { getApp } from "@react-native-firebase/app";
import { logError } from "./crashlytics";
import { sanitizeName } from "./helper";
import { initializePerformanceMonitoring } from "./performance";

const app = getApp();
const analytics = getAnalytics(app);

const MAX_PARAM_LENGTH = 40;
const MAX_VALUE_LENGTH = 100;
const DISALLOWED_PREFIXES = ["firebase_", "google_", "ga_"];

const sanitize = (value, fallback) => {
  const sanitized = sanitizeName(value, MAX_PARAM_LENGTH, fallback);
  const lower = sanitized.toLowerCase();
  if (DISALLOWED_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return fallback;
  }
  return sanitized;
};

const safeStr = (value, fallback = "unknown") =>
  value != null && String(value).trim() !== ""
    ? String(value).slice(0, MAX_VALUE_LENGTH)
    : fallback;

const safeInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
};

// Safely log events with error handling
const trackEvent = async (category, action, label) => {
  const eventName = sanitize(category, "custom_event");
  const paramName = sanitize(action, "detail");
  const paramValue = label == null ? "" : String(label).slice(0, MAX_VALUE_LENGTH);

  try {
    await logEvent(analytics, eventName, {
      [paramName]: paramValue,
    });
  } catch (error) {
    logError(
      new Error(
        `Analytics tracking failed for category: ${eventName}, param: ${paramName} - ${
          error?.message || "Unknown error"
        }`
      )
    );
  }
};

const allowTracking = async (isStatistics) => {
  // Performance monitoring follows the same Statistics setting.
  initializePerformanceMonitoring(isStatistics);
  try {
    await setAnalyticsCollectionEnabled(analytics, isStatistics);
  } catch (error) {
    logError(
      new Error(`Failed to initialize analytics tracking - ${error?.message || "Unknown error"}`)
    );
  }
};

const trackScreenView = async (screenName, key, title) => {
  try {
    const params = {
      screen_name: screenName || "unknown",
      screen_class: (screenName || "unknown").replace(/\s+/g, ""),
    };

    if (key != null) {
      params.key = String(key).slice(0, MAX_VALUE_LENGTH);
    }
    if (title != null) {
      params.title = String(title).slice(0, MAX_VALUE_LENGTH);
    }

    await logEvent(analytics, "screen_view", params);
  } catch (error) {
    logError(
      new Error(`Failed to track screen view: ${screenName} - ${error?.message || "Unknown error"}`)
    );
  }
};

const trackReaderEvent = async (action, label) => {
  await trackEvent("reader", action, label);
};

const trackAudioEvent = async (action, label) => {
  await trackEvent("audio", action, label);
};

const trackSettingEvent = async (action, label) => {
  await trackEvent("setting", action, label);
};

const trackReminderEvent = async (action, label) => {
  await trackEvent("reminder", action, label);
};

// ---------------------------------------------------------------------------
// Dedicated audio analytics events — one Firebase event name per action type.
// This eliminates (not set) values that result from sharing a single "audio"
// event name across params that only some sub-events populate.
// ---------------------------------------------------------------------------

const trackBaniOpen = async (baniID, title, artist) => {
  try {
    await logEvent(analytics, "bani_open", {
      bani_id: safeStr(baniID),
      bani_title: safeStr(title),
      artist: safeStr(artist, "none"),
    });
  } catch (error) {
    logError(new Error(`bani_open tracking failed - ${error?.message || "Unknown error"}`));
  }
};

// Fires when a listening session ends (artist changed, paused, or screen exit).
// trackLengthSec is the full track duration; durationSec is the actual time listened.
const trackBaniListen = async (baniID, baniTitle, artist, durationSec, trackLengthSec) => {
  try {
    const sec = safeInt(durationSec);
    const min = sec > 0 ? parseFloat((sec / 60).toFixed(1)) : 0;
    await logEvent(analytics, "bani_listen", {
      bani_id: safeStr(baniID),
      bani_title: safeStr(baniTitle),
      artist: safeStr(artist, "none"),
      duration_sec: sec,
      duration_min: min,
      track_length_sec: safeInt(trackLengthSec),
    });
  } catch (error) {
    logError(new Error(`bani_listen tracking failed - ${error?.message || "Unknown error"}`));
  }
};

// Fires when playback session ends (navigation away / unmount) with position context.
// Enables % completion and half-listened segmentation in Firebase Explore.
const trackBaniListenCompletion = async (baniID, title, artist, positionSec, trackLengthSec) => {
  try {
    const position = safeInt(positionSec);
    const length = safeInt(trackLengthSec);
    const pct = length > 0 ? Math.min(100, Math.round((position / length) * 100)) : 0;
    let tier;
    if (pct >= 90) {
      tier = "completed";
    } else if (pct >= 40) {
      tier = "half";
    } else {
      tier = "partial";
    }
    await logEvent(analytics, "bani_listen_completion", {
      bani_id: safeStr(baniID),
      bani_title: safeStr(title),
      artist: safeStr(artist, "none"),
      position_sec: position,
      track_length_sec: length,
      percent_complete: pct,
      completion_tier: tier,
    });
  } catch (error) {
    logError(
      new Error(`bani_listen_completion tracking failed - ${error?.message || "Unknown error"}`)
    );
  }
};

const trackBaniArtistDefault = async (baniID, artist) => {
  try {
    await logEvent(analytics, "bani_artist_default", {
      bani_id: safeStr(baniID),
      artist: safeStr(artist, "none"),
    });
  } catch (error) {
    logError(
      new Error(`bani_artist_default tracking failed - ${error?.message || "Unknown error"}`)
    );
  }
};

const trackTrackDownload = async (baniID, artist, baniTitle) => {
  try {
    await logEvent(analytics, "track_download", {
      bani_id: safeStr(baniID),
      artist: safeStr(artist, "none"),
      bani_title: safeStr(baniTitle),
    });
  } catch (error) {
    logError(new Error(`track_download tracking failed - ${error?.message || "Unknown error"}`));
  }
};

// Fires when user taps "Request audio" for a bani that has no recorded tracks.
const trackAudioLinkRequest = async (baniTitle, baniID, baniLength) => {
  try {
    await logEvent(analytics, "audio_link_request", {
      bani_title: safeStr(baniTitle),
      bani_id: safeStr(baniID),
      bani_length: safeStr(baniLength),
    });
  } catch (error) {
    logError(
      new Error(`audio_link_request tracking failed - ${error?.message || "Unknown error"}`)
    );
  }
};

// Fires once when user leaves the ReaderScreen.
// sync_scroll "on"/"off" lets Firebase segment users who used audio sync scroll.
const trackScrollProgress = async (baniID, baniTitle, scrollPercent, syncScrollEnabled) => {
  try {
    const pct = Math.min(100, Math.max(0, safeInt(scrollPercent)));
    let tier;
    if (pct >= 90) {
      tier = "complete";
    } else if (pct >= 40) {
      tier = "half";
    } else {
      tier = "partial";
    }
    await logEvent(analytics, "scroll_progress", {
      bani_id: safeStr(baniID),
      bani_title: safeStr(baniTitle),
      scroll_percent: pct,
      scroll_tier: tier,
      sync_scroll: syncScrollEnabled ? "on" : "off",
    });
  } catch (error) {
    logError(new Error(`scroll_progress tracking failed - ${error?.message || "Unknown error"}`));
  }
};

// Fires whenever the reader's header + bottom navigation bar are shown or hidden,
// as two distinct events (NAV_BAR_SHOW / NAV_BAR_HIDE) so each is a first-class
// metric in Firebase. trigger: "tap" | "scroll_up" | "scroll_down" |
// "auto_hide_idle" separates deliberate toggles from the inactivity auto-hide;
// mode: "reading" | "audio" | "autoscroll" is the active reading context.
const trackNavBar = async (visible, trigger, mode) => {
  try {
    await logEvent(analytics, visible ? "NAV_BAR_SHOW" : "NAV_BAR_HIDE", {
      trigger: safeStr(trigger, "unknown"),
      mode: safeStr(mode, "reading"),
    });
  } catch (error) {
    logError(
      new Error(`nav_bar visibility tracking failed - ${error?.message || "Unknown error"}`)
    );
  }
};

export {
  allowTracking,
  trackReaderEvent,
  trackNavBar,
  trackSettingEvent,
  trackReminderEvent,
  trackScreenView,
  trackAudioEvent,
  // Dedicated per-action events (replace the old single "audio" umbrella event)
  trackBaniOpen,
  trackBaniListen,
  trackBaniListenCompletion,
  trackBaniArtistDefault,
  trackTrackDownload,
  trackAudioLinkRequest,
  trackScrollProgress,
};
