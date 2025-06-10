/**
 * @format
 */

import { AppRegistry } from "react-native";
import TrackPlayer from "react-native-track-player";
import notifee, { EventType } from "@notifee/react-native";
import App from "./app";
import { resetBadgeCount } from "./src/common/notifications";
import { navigateTo } from "./src/common/rootNavigation";
import { name as appName } from "./app.json";

notifee.onBackgroundEvent(async ({ type, detail }) => {
  resetBadgeCount();
  if (type === EventType.PRESS) {
    navigateTo(detail);
  }
});
// Register TrackPlayer service
TrackPlayer.registerPlaybackService(() => require("./src/services/TrackPlayerService"));

AppRegistry.registerComponent(appName, () => App);
