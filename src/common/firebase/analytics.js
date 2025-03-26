import {
  getAppInstanceId,
  logScreenView,
  logEvent,
  getAnalytics,
  setAnalyticsCollectionEnabled,
} from "@react-native-firebase/analytics";
import { getApp } from "@react-native-firebase/app";

const app = getApp();
const analytics = getAnalytics(app);
const trackEvent = (category, action, label) => {
  logEvent(analytics, category, {
    [action]: label,
  });
};

const allowTracking = async () => {
  const appInstanceId = await getAppInstanceId(analytics);
  if (!appInstanceId) {
    await setAnalyticsCollectionEnabled(analytics, true);
  }
};

const trackScreenView = (screenName, screenClass = screenName) => {
  logScreenView(analytics, {
    screen_name: screenName,
    screen_class: screenClass.replace(/\s+/g, ""),
  });
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

export { allowTracking, trackReaderEvent, trackSettingEvent, trackScreenView, trackReminderEvent };
