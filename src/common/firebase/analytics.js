import {
  getAppInstanceId,
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
    // Silently fail - analytics should never crash the app
    logError(
      new Error(
        `Analytics tracking failed for category: ${eventName}, param: ${paramName} - ${
          error?.message || "Unknown error"
        }`
      )
    );
  }
};

const allowTracking = async () => {
  try {
    const appInstanceId = await getAppInstanceId(analytics);
    if (!appInstanceId) {
      await setAnalyticsCollectionEnabled(analytics, true);
    }
  } catch (error) {
    // Silently fail - analytics initialization should never crash the app
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

    // Only add optional parameters if they have values
    if (key != null) {
      params.key = String(key).slice(0, MAX_VALUE_LENGTH);
    }
    if (title != null) {
      params.title = String(title).slice(0, MAX_VALUE_LENGTH);
    }

    await logEvent(analytics, "screen_view", params);
  } catch (error) {
    // Silently fail - screen tracking should never crash the app
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

const trackArtistListeningDuration = async (baniID, artist, duration) => {
  const params = {
    event: "artistListenDuration",
    baniID,
    artist,
    duration,
  };
  await logEvent(analytics, "audio", params);
};

const trackArtist = async (baniID, artist) => {
  const params = {
    event: "defaultArtist",
    baniID,
    artist,
  };
  await logEvent(analytics, "audio", params);
};

const trackSettingEvent = async (action, label) => {
  await trackEvent("setting", action, label);
};

const trackReminderEvent = async (action, label) => {
  await trackEvent("reminder", action, label);
};

// Wrapper to safely handle analytics operations
export const safeAnalyticsOperation = (operation) => {
  try {
    return operation();
  } catch (error) {
    logError(new Error(`Safe analytics operation failed - ${error?.message || "Unknown error"}`));
    return null;
  }
};

export {
  allowTracking,
  trackReaderEvent,
  trackSettingEvent,
  trackReminderEvent,
  trackScreenView,
  trackAudioEvent,
  trackArtistListeningDuration,
  trackArtist,
};
