import { GoogleAnalyticsTracker } from "react-native-google-analytics-bridge";

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
    if (enabled && this._tracker == null) {
      this._tracker = new GoogleAnalyticsTracker(this.TRACKING_ID);
    }
  }

  trackScreenView(screen) {
    if (this._trackingOn) {
      this._tracker.trackScreenView(screen);
    }
  }

  trackEvent(action, label) {
    if (this._trackingOn) {
      this._tracker.trackEvent("setting", action, {
        label: '' + label
      });
    }
  }
}
