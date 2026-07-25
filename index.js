/**
 * @format
 */

import { AppRegistry, NativeModules } from "react-native";
// react-native-track-player is required conditionally below to prevent
// RNTP's Capability.js IIFE from crashing when NativeModules.TrackPlayerModule
// is null (stale APK / native build mismatch). A static import would run before
// any code and crash the app before AppRegistry.registerComponent is called.
import notifee, { EventType } from "@notifee/react-native";
import App from "./app";
import { name as appName } from "./app.json";
import { resetBadgeCount } from "./src/common/notifications";
import { navigateTo } from "./src/common/rootNavigation";

notifee.onBackgroundEvent(async ({ type, detail }) => {
  resetBadgeCount();
  if (type === EventType.PRESS) {
    navigateTo(detail);
  }
});
// Register TrackPlayer service — guarded to prevent crash when
// NativeModules.TrackPlayerModule is null (native build not yet installed).
if (NativeModules.TrackPlayerModule != null) {
  const TrackPlayer = require("react-native-track-player").default;
  TrackPlayer.registerPlaybackService(() => require("./src/services/TrackPlayerService"));
} else {
  // This will never happen on a correctly installed production build, but
  // prevents a full startup crash during development / after a clean install.
  // Intentional last-resort diagnostic: this runs at index.js load, before the
  // app's logError/Crashlytics infra exists, so console is the only channel.
  // eslint-disable-next-line no-console
  console.error(
    "[TrackPlayer] NativeModules.TrackPlayerModule is null. Audio is disabled. Reinstall or rebuild the app."
  );
}

AppRegistry.registerComponent(appName, () => App);
