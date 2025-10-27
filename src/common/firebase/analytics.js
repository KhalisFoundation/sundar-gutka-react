import {
  getAppInstanceId,
  logEvent,
  getAnalytics,
  setAnalyticsCollectionEnabled,
} from "@react-native-firebase/analytics";
import { getApp } from "@react-native-firebase/app";
import { logError } from "./crashlytics";

const app = getApp();
const analytics = getAnalytics(app);

// Safely log events with error handling
const trackEvent = (category, action, label) => {
  try {
    logEvent(analytics, category, {
      [action]: label,
    });
  } catch (error) {
    // Silently fail - analytics should never crash the app
    logError(
      new Error(
        `Analytics tracking failed for category: ${category}, action: ${action} - ${
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

const trackScreenView = (screenName, screenClass = screenName) => {
  try {
    logEvent(analytics, "screen_view", {
      screen_name: screenName,
      screen_class: screenClass.replace(/\s+/g, ""),
    });
  } catch (error) {
    // Silently fail - screen tracking should never crash the app
    logError(
      new Error(
        `Failed to track screen view: ${screenName} (${screenClass}) - ${
          error?.message || "Unknown error"
        }`
      )
    );
  }
};

const trackReaderEvent = (action, label) => {
  trackEvent("reader", action, label);
};

const trackSettingEvent = (action, label) => {
  trackEvent("setting", action, label);
};

const trackReminderEvent = (action, label) => {
  trackEvent("reminder", action, label);
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

export { allowTracking, trackReaderEvent, trackSettingEvent, trackScreenView, trackReminderEvent };
