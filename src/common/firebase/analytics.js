import {
  logEvent,
  getAnalytics,
  setAnalyticsCollectionEnabled,
} from "@react-native-firebase/analytics";
import { getApp } from "@react-native-firebase/app";
import { logError } from "./crashlytics";
import { sanitizeName } from "./helper";

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
const completionTier = (percent, complete, halfway, completeLabel = "completed") => {
  if (percent >= complete) return completeLabel;
  if (percent >= halfway) return "half";
  return "partial";
};

const trackBaniListenCompletion = async (baniID, title, artist, positionSec, trackLengthSec) => {
  try {
    const position = safeInt(positionSec);
    const length = safeInt(trackLengthSec);
    const pct = length > 0 ? Math.min(100, Math.round((position / length) * 100)) : 0;
    const tier = completionTier(pct, 90, 40);
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
    const tier = completionTier(pct, 90, 40, "complete");
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

// Nav-bar (top app bar + bottom navigation) show/hide. `trigger` is one of
// tap | scroll_up | scroll_down | auto_hide_idle; `mode` is reading | autoscroll | audio.
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
// Every param is sanitized so nothing reaches Firebase as null/empty/wrong-type
// (which would surface as "(not set)"): booleans → "true"/"false", numbers →
// safe ints, strings trimmed; null/undefined/empty values are dropped entirely.
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

// Firebase drops a param that is null, empty or the wrong type, and silently
// truncates a long one. Shared by every namespaced tracker below so they cannot
// drift on what they consider a safe param.
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

const trackSevaEvent = async (action, params = {}) => {
  try {
    const eventName = SEVA_EVENT_NAMES[action] || sanitize(`seva_${action}`, "seva_event");
    await logEvent(analytics, eventName, sanitizeParams(params));
  } catch (error) {
    logError(
      new Error(`Seva analytics failed for ${action} - ${error?.message || "Unknown error"}`)
    );
  }
};

// My Pothi. One event name per action, so each carries only the params it
// actually populates — a shared "pothi" umbrella would leave (not set) on every
// param the other actions do not set, which is why the audio events were split.
const POTHI_EVENT_NAMES = {
  created: "pothi_created",
  bani_added: "pothi_bani_added",
  bani_removed: "pothi_bani_removed",
  opened: "pothi_opened",
  renamed: "pothi_renamed",
  deleted: "pothi_deleted",
  reordered: "pothi_reordered",
  pinned: "pothi_pinned",
  unpinned: "pothi_unpinned",
  // A pothi left with no banis in it, reported where the edit is committed —
  // see Pothi/reportPothiEmptied. `size` is what it held before, `surface`
  // where it happened. Both are already registered in GA4.
  emptied: "pothi_emptied",
};

const trackPothiEvent = async (action, params = {}) => {
  try {
    const eventName = POTHI_EVENT_NAMES[action] || sanitize(`pothi_${action}`, "pothi_event");
    await logEvent(analytics, eventName, sanitizeParams(params));
  } catch (error) {
    logError(
      new Error(`Pothi analytics failed for ${action} - ${error?.message || "Unknown error"}`)
    );
  }
};

// One namespaced tracker per feature, all on the same rule as Seva and Pothi:
// a fixed map of event names, so a typo at a call site cannot invent an event,
// and `sanitizeParams` on the way out, so nothing reaches Firebase as (not set).
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

// The Dashboard, and above all its Explore row. `explore_tile_tap` carries
// `tile_id` (the backend's tile key), `tile_title`, `outcome` (app | store |
// browser — which of the three deep-link levels took the tap), `position`,
// `has_app` (whether the tile offered an app route on THIS platform, so a
// browser outcome on a web-only tile is not read as a failed app open),
// `badge`, `tile_count` and `source` (network | cache | bundled — where the
// tile list came from), so a campaign can tell an installed-app open from a
// store visit from a web fallback.
//
// `explore_impression` is the denominator those taps need: the same row, seen
// and not tapped, is what makes a tile's tap count mean anything. Without it a
// tile's total says as much about how often the row was on screen as about the
// tile. Divide tile_tap by impression for a per-tile click-through rate.
const DASHBOARD_EVENT_NAMES = {
  explore_tile_tap: "dashboard_explore_tile_tap",
  explore_impression: "dashboard_explore_impression",
  continue_reading_tap: "dashboard_continue_reading_tap",
  continue_listening_tap: "dashboard_continue_listening_tap",
  vaak_open: "dashboard_vaak_open",
  vaak_refreshed: "dashboard_vaak_refreshed",
  shabad_open: "dashboard_shabad_open",
  shabad_shuffle: "dashboard_shabad_shuffle",
  shabad_vaak_tab: "dashboard_shabad_vaak_tab",
  nitnem_bani_open: "dashboard_nitnem_bani_open",
  nitnem_edit_opened: "dashboard_nitnem_edit_opened",
  nitnem_banis_saved: "dashboard_nitnem_banis_saved",
  // Finishing the nitnem, which is the point of the card and was the one
  // action on it that reported nothing. `source` separates the two routes —
  // the Mark done button against a single tick — and `count` is how many banis
  // the press actually completed, so the button's bulk press is not one event
  // indistinguishable from a tick.
  //
  // Un-ticking is its OWN event rather than a status on this one, per the
  // convention below: an undo must never be counted as a completion, and a
  // filter is easy to forget. It is also a real signal — it usually means the
  // 95%-scroll auto-detection marked something the reader had not finished.
  nitnem_marked_done: "dashboard_nitnem_marked_done",
  nitnem_unmarked: "dashboard_nitnem_unmarked",
  // A day cell carries `outcome`, so the taps that open nothing are counted
  // too: a run of `empty` on the calendar is a UI problem, not a quiet one.
  day_tapped: "dashboard_day_tapped",
  week_navigated: "dashboard_week_navigated",
  month_navigated: "dashboard_month_navigated",
  reminders_opened: "dashboard_reminders_opened",
  // A reminder row tapped open to change its time, text or delete it.
  reminder_edit_opened: "dashboard_reminder_edit_opened",
  sections_sheet_opened: "dashboard_sections_sheet_opened",
  sections_changed: "dashboard_sections_changed",
  sections_reset: "dashboard_sections_reset",
  section_jump: "dashboard_section_jump",
  refreshed: "dashboard_refreshed",
};
const trackDashboardEvent = namespacedTracker(DASHBOARD_EVENT_NAMES, "dashboard");

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

// Khalis SSO. One event per outcome rather than one event with a status
// param, so each shows up as its own row in the funnel. Every sign-in event
// carries `entry_point` (dashboard_header | settings) — the two places that
// can start one convert very differently, and a single total hides that.
//
// session_restored and session_expired are the lifecycle either side of the
// funnel: a session picked up from the Keychain at launch is NOT a sign-in and
// must not inflate one, and an expiry is the silent way accounts are lost.
const SSO_EVENT_NAMES = {
  sign_in_started: "sso_sign_in_started",
  sign_in_success: "sso_sign_in_success",
  sign_in_cancelled: "sso_sign_in_cancelled",
  sign_in_pending: "sso_sign_in_pending",
  sign_in_failed: "sso_sign_in_failed",
  sign_out: "sso_sign_out",
  session_restored: "sso_session_restored",
  session_expired: "sso_session_expired",
  account_deleted: "sso_account_deleted",
  account_delete_failed: "sso_account_delete_failed",
};
const trackSsoEvent = namespacedTracker(SSO_EVENT_NAMES, "sso");
// The first-run onboarding carousel. `started` is the denominator; the other
// three are the ways out of it, and which one it was is the whole question —
// a tour people finish and a tour people skip on slide one are the same total.
// `step_id` and `step_index` say where they left, so a slide that loses
// everyone is visible rather than averaged away.
//
// A fixed map like every other family here, rather than the raw event name the
// caller used to pass: that signature let a call site invent an event.
const TOUR_EVENT_NAMES = {
  started: "tour_started",
  completed: "tour_completed",
  skipped: "tour_skipped",
  dismissed: "tour_dismissed",
};
const trackTourEvent = namespacedTracker(TOUR_EVENT_NAMES, "tour");

// The in-app Punjabi keyboard. `opened` fires each time someone switches it on;
// GA4's Users metric on it is how many people use the keyboard. `surface` is
// the field it was opened on: create_pothi_name | create_pothi_search |
// add_banis_search | rename_pothi.
const PUNJABI_KEYBOARD_EVENT_NAMES = {
  opened: "punjabi_keyboard_opened",
};
const trackPunjabiKeyboardEvent = namespacedTracker(
  PUNJABI_KEYBOARD_EVENT_NAMES,
  "punjabi_keyboard"
);

// ─── Journey dashboard events ─────────────────────────────────────────────────

const trackJourneyView = async (currentStreak, totalActiveDays) => {
  try {
    await logEvent(analytics, "journey_viewed", {
      current_streak: safeInt(currentStreak),
      total_active_days: safeInt(totalActiveDays),
    });
  } catch (error) {
    logError(new Error(`journey_viewed tracking failed - ${error?.message || "Unknown error"}`));
  }
};

const trackKhalisAppClicked = async (appName) => {
  try {
    await logEvent(analytics, "khalis_app_clicked", {
      app_name: safeStr(appName),
    });
  } catch (error) {
    logError(
      new Error(`khalis_app_clicked tracking failed - ${error?.message || "Unknown error"}`)
    );
  }
};

// ─── Session lifecycle events ─────────────────────────────────────────────────

const trackBaniCompleted = async (baniId, baniTitle, durationSeconds) => {
  try {
    await logEvent(analytics, "bani_completed", {
      bani_id: safeStr(baniId),
      bani_title: safeStr(baniTitle),
      duration_seconds: safeInt(durationSeconds),
    });
  } catch (error) {
    logError(new Error(`bani_completed tracking failed - ${error?.message || "Unknown error"}`));
  }
};

const trackAudioStarted = async (audioId, baniName, artistName) => {
  try {
    await logEvent(analytics, "audio_started", {
      audio_id: safeStr(audioId),
      bani_name: safeStr(baniName),
      artist_name: safeStr(artistName),
    });
  } catch (error) {
    logError(new Error(`audio_started tracking failed - ${error?.message || "Unknown error"}`));
  }
};

const trackAudioCompleted = async (durationSeconds, artistId) => {
  try {
    await logEvent(analytics, "audio_completed", {
      duration_seconds: safeInt(durationSeconds),
      artist_id: safeStr(artistId),
    });
  } catch (error) {
    logError(new Error(`audio_completed tracking failed - ${error?.message || "Unknown error"}`));
  }
};

export {
  allowTracking,
  trackReaderEvent,
  trackSettingEvent,
  trackReminderEvent,
  trackScreenView,
  trackAudioEvent,
  trackSevaEvent,
  trackPothiEvent,
  trackDashboardEvent,
  trackThemeEvent,
  trackSsoEvent,
  // Dedicated per-action events (replace the old single "audio" umbrella event)
  trackBaniOpen,
  trackBaniListen,
  trackBaniListenCompletion,
  trackBaniArtistDefault,
  trackTrackDownload,
  trackAudioLinkRequest,
  trackScrollProgress,
  trackNavBar,
  trackPlayerForm,
  trackTourEvent,
  trackPunjabiKeyboardEvent,
  // Journey + session lifecycle events
  trackJourneyView,
  trackKhalisAppClicked,
  trackBaniCompleted,
  trackAudioStarted,
  trackAudioCompleted,
};
