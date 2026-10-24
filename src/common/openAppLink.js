import { Platform } from "react-native";

// Links that have an app behind them. Today that is this app's own store
// listing, the destination of an "update available" push (see rootNavigation).

/** The store URLs for this platform, or null when there is no listing here. */
// Named: the app-link opener joins it here with the Dashboard's Explore links.
// eslint-disable-next-line import/prefer-default-export
export const storeUrlsFor = ({ androidPkg, iosAppId }) => {
  if (Platform.OS === "android") {
    if (!androidPkg) return null;
    return {
      app: `market://details?id=${androidPkg}`,
      web: `https://play.google.com/store/apps/details?id=${androidPkg}`,
    };
  }
  if (Platform.OS === "ios") {
    if (!iosAppId) return null;
    return {
      app: `itms-apps://apps.apple.com/app/id${iosAppId}`,
      web: `https://apps.apple.com/app/id${iosAppId}`,
    };
  }
  return null;
};
