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

const trackTrackDownload = async (baniID, artist, baniTitle, networkType) => {
  try {
    await logEvent(analytics, "track_download", {
      bani_id: safeStr(baniID),
      artist: safeStr(artist, "none"),
      bani_title: safeStr(baniTitle),
      // Connection used for the download — always "wifi" | "mobile_data" |
      // "unknown", never blank/null, so this Firebase dimension has no (not set).
      network_type: safeStr(networkType, "unknown"),
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

// The audio player's form, and every conversion between the three of them:
//
//   full  — the whole control bar
//   mini  — the floating pill: progress circle + track name
//   micro — the pill collapsed to just the circle
//
// One event with a `form` param rather than an event per transition, so the
// funnel can be read either way round in Firebase: how often each form is
// reached, and what caused it. `trigger` is one of
//   reader_tap | scroll_up | scroll_down | idle | mini_tap | pause | control.
const trackPlayerForm = async (form, trigger) => {
  try {
    await logEvent(analytics, "audio_player_form", {
      form: safeStr(form, "unknown"),
      trigger: safeStr(trigger, "unknown"),
    });
  } catch (error) {
    logError(new Error(`audio_player_form tracking failed - ${error?.message || "Unknown error"}`));
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

// Firebase drops a param that is null, empty or the wrong type, and silently
// truncates a long one. Shared by every namespaced tracker so they cannot drift
// on what they consider a safe param.
const sanitizeParams = (params) => {
  const safeParams = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value == null) {
      return; // drop null/undefined — never emit an empty param
    }
    const paramName = sanitize(key, "param");
    if (typeof value === "boolean") {
      safeParams[paramName] = value ? "true" : "false";
    } else if (typeof value === "number") {
      if (Number.isFinite(value)) {
        safeParams[paramName] = safeInt(value);
      }
    } else {
      const str = String(value).trim();
      if (str !== "") {
        safeParams[paramName] = str.slice(0, MAX_VALUE_LENGTH);
      }
    }
  });
  return safeParams;
};

// One tracker per feature: a known action maps to its event name, anything else
// to `<prefix>_<action>`.
const namespacedTracker =
  (names, prefix) =>
  async (action, params = {}) => {
    try {
      const eventName = names[action] || sanitize(`${prefix}_${action}`, `${prefix}_event`);
      await logEvent(analytics, eventName, sanitizeParams(params));
    } catch (error) {
      logError(
        new Error(`${prefix} analytics failed for ${action} - ${error?.message || "Unknown error"}`)
      );
    }
  };

// Seva donation funnel — IN-APP, OBSERVABLE steps only. Funnel:
//   opened (landing) → frequency_changed (donation type) → amount_selected
//   → payment_started (Donate tapped) → payment_success (Qgiv handoff opened).
// On exit before the handoff we emit checkout_abandoned with the furthest step
// reached. A visit is a FOCUS of the Seva tab, not a mount — the tab stays
// mounted once visited, so opened/checkout_abandoned are emitted per visit.
// below_minimum sits off to the side of the funnel: the donor tapped Donate and
// was refused because the amount was under what Qgiv can charge, so no
// payment_started follows. Without it those donors are indistinguishable from
// the ones who simply left, since both end the visit at amount_selected.
// NOTE on payment_success: real payment confirmation lives on Qgiv, which the
// app hands off to in the in-app browser and cannot observe. Per product
// decision, OPENING the Qgiv handoff is counted as a successful donation, so
// payment_success fires on browser-open — it is a conversion proxy, not a
// Qgiv-confirmed payment. Donor details, payment failures and locality remain
// unobservable and are not emitted.
// Call sites always pass real values for the required dimensions (donation_type,
// amount_bucket, last_step_reached).
const SEVA_EVENT_NAMES = {
  opened: "seva_opened",
  frequency_changed: "seva_frequency_changed",
  amount_selected: "seva_amount_selected",
  below_minimum: "seva_amount_below_minimum",
  payment_started: "seva_payment_started",
  payment_success: "seva_payment_success",
  checkout_abandoned: "seva_checkout_abandoned",
};
const trackSevaEvent = namespacedTracker(SEVA_EVENT_NAMES, "seva");

// Reading themes. `selected` carries `theme_id`, `previous` and `source`
// (bundled | remote), so a theme served from the backend is measurable
// against the shipped ones. `picker_opened` is its denominator — how many
// people opened the grid against how many changed anything — and carries the
// theme in force plus how many of the offered options came from the backend.
const THEME_EVENT_NAMES = {
  selected: "theme_selected",
  picker_opened: "theme_picker_opened",
  remote_loaded: "theme_remote_loaded",
};
const trackThemeEvent = namespacedTracker(THEME_EVENT_NAMES, "theme");

export {
  trackThemeEvent,
  trackSevaEvent,
  allowTracking,
  trackReaderEvent,
  trackNavBar,
  trackPlayerForm,
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
