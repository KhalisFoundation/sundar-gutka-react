import { GoogleAnalyticsTracker } from "react-native-google-analytics-bridge";
import firebase from "react-native-firebase";

export default class AnalyticsManager {
  TRACKING_ID = "UA-45513519-1";
  static myInstance = null;
  _trackingOn = false;
  _tracker;

  static getInstance() {
    if (this.myInstance === null) {
      this.myInstance = new AnalyticsManager();
    }
    return this.myInstance;
  }

  allowTracking(enabled) {
    this._trackingOn = enabled;
    firebase.analytics().setAnalyticsCollectionEnabled(enabled);
    if (enabled && this._tracker == null) {
      this._tracker = new GoogleAnalyticsTracker(this.TRACKING_ID);
    }
  }

  trackScreenView(screen, className) {
    if (this._trackingOn) {
      this._tracker.trackScreenView(screen);
      firebase.analytics().setCurrentScreen(screen, className);
    }
  }

  trackReaderEvent(action, label) {
    if (this._trackingOn) {
      // this._tracker.trackEvent("reader", action, {
      //   label: "" + label
      // });

      firebase.analytics().logEvent("reader", {
        [action]: "" + label
      });
    }
  }

  trackSettingsEvent(action, label) {
    if (this._trackingOn) {
      // this._tracker.trackEvent("setting", action, {
      //   label: "" + label
      // });

      firebase.analytics().logEvent("setting", {
        [action]: "" + label
      });
    }
  }

  trackRemindersEvent(action, label) {
    if (this._trackingOn) {
      // this._tracker.trackEvent("reminder", action, {
      //   label: "" + label
      // });

      firebase.analytics().logEvent("reminder", {
        [action]: "" + label
      });
    }
  }
}
