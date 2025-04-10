/**
 * @format
 */

import { AppRegistry } from "react-native";
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

AppRegistry.registerComponent(appName, () => App);
