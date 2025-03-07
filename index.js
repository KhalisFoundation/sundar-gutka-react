/**
 * @format
 */

import { AppRegistry } from "react-native";
import notifee, { EventType } from "@notifee/react-native";
import App from "./app";
import { name as appName } from "./app.json";
import { navigateTo } from "./src/navigation/util";

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification } = detail;

  // Check if the user pressed the "Mark as read" action
  if (type === EventType.ACTION_PRESS) {
    navigateTo(detail);
    await notifee.cancelNotification(notification.id);
  }
});

AppRegistry.registerComponent(appName, () => App);
