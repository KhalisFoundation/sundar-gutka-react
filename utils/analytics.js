import { firebase } from '@react-native-firebase/analytics';

export default class AnalyticsManager {
  static myInstance = null;
  _trackingOn = false;

  static getInstance() {
    if (this.myInstance === null) {
      this.myInstance = new AnalyticsManager();
    }
    return this.myInstance;
  }

  allowTracking(enabled) {
    this._trackingOn = enabled;
    firebase.analytics().setAnalyticsCollectionEnabled(enabled);
  }

  trackScreenView(screen, className) {
    if (this._trackingOn) {
      firebase.analytics().logScreenView(
        {
          screen_name: screen,
          screen_class: className,
        });
    }
  }

  trackReaderEvent(action, label) {
    if (this._trackingOn) {
      firebase.analytics().logEvent("reader", {
        [action]: "" + label
      });
    }
  }

  trackSettingsEvent(action, label) {
    if (this._trackingOn) {
      firebase.analytics().logEvent("setting", {
        [action]: "" + label
      });
    }
  }

  trackRemindersEvent(action, label) {
    if (this._trackingOn) {
      firebase.analytics().logEvent("reminder", {
        [action]: "" + label
      });
    }
  }
}
