import analytics, { firebase } from "@react-native-firebase/analytics";

const trackEvent = (category, action, label) => {
  firebase.analytics().logEvent(category, {
    [action]: label,
  });
};

const allowTracking = async () => {
  const appInstanceId = await analytics().getAppInstanceId();
  if (!appInstanceId) {
    await firebase.analytics().setAnalyticsCollectionEnabled(true);
  }
};

const trackScreenView = (screenName, screenClass = screenName) => {
  firebase.analytics().logScreenView({
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
