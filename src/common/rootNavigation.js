import { Linking } from "react-native";
import { createNavigationContainerRef } from "@react-navigation/native";
import { getBaniByID } from "@database";
import constant from "./constant";
import { logError, logMessage } from "./firebase/crashlytics";
import { openInAppBrowser } from "./inAppBrowser";
import { storeUrlsFor } from "./openAppLink";
import {
  ROUTE_DASHBOARD,
  ROUTE_READER,
  ROUTE_SETTINGS,
  ROUTE_SEVA,
  ROUTE_STORE,
  ROUTE_UPDATE,
  ROUTE_URL,
  routeForNotification,
} from "./pushRouting";

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

// A notification tapped while the app is fully closed is reported before the
// navigator exists: the app has to load its saved state before the first
// screen mounts. `navigate` drops a call made then, so a reminder opened the
// app on its default screen instead of its bani. Where a notification sends
// the user is therefore held until the navigator is ready, and taken then.
// Only the latest is kept — the one the user tapped last is the one they want.
let pendingNotificationRoute = null;

const navigateWhenReady = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    pendingNotificationRoute = { name, params };
  }
};

/** Takes a notification's held destination. Called once the navigator is ready. */
export const flushPendingNotificationRoute = () => {
  if (!pendingNotificationRoute || !navigationRef.isReady()) return;
  const { name, params } = pendingNotificationRoute;
  pendingNotificationRoute = null;
  navigationRef.navigate(name, params);
};

// Opens the bani a reminder or a campaign points at.
const openBani = async ({ id, title }) => {
  // The Reader wants the Unicode title too; a campaign will not carry one,
  // so it is looked up. A miss is not fatal — the header falls back to `title`.
  let titleUni;
  try {
    titleUni = (await getBaniByID(id))?.gurmukhiUni;
  } catch (_) {
    titleUni = undefined;
  }
  navigateWhenReady(constant.READER, {
    key: `Reader-${id}`,
    params: { id, title, ...(titleUni && { titleUni }) },
  });
};

// This app's own store page — the destination of an "update available" push.
// The store app first, the web listing in the in-app browser if there is none.
const openOwnStoreListing = async () => {
  const urls = storeUrlsFor({
    androidPkg: constant.APP_ANDROID_PACKAGE,
    iosAppId: constant.APP_IOS_APP_ID,
  });
  if (!urls) return;
  try {
    await Linking.openURL(urls.app);
  } catch (_) {
    await openInAppBrowser(urls.web);
  }
};

/**
 * Where a tapped notification goes. Takes the notifee event detail (the
 * shape both the reminder scheduler and a push campaign arrive in) and acts
 * on its data payload — see pushRouting for the routes. A payload this build
 * cannot place opens the app where it was, and says so in the breadcrumbs.
 */
export const navigateTo = async (incoming) => {
  const target = routeForNotification(incoming?.notification?.data);
  if (!target) {
    logMessage("navigateTo: notification carried no route this build knows");
    return;
  }
  switch (target.route) {
    case ROUTE_READER:
      await openBani(target);
      return;
    case ROUTE_SEVA:
      navigateWhenReady(constant.SEVA);
      return;
    case ROUTE_UPDATE:
      navigateWhenReady(constant.DATABASE_UPDATE);
      return;
    case ROUTE_DASHBOARD:
      navigateWhenReady(constant.DASHBOARD);
      return;
    case ROUTE_SETTINGS:
      navigateWhenReady(constant.SETTINGS);
      return;
    case ROUTE_URL:
      await openInAppBrowser(target.url);
      return;
    case ROUTE_STORE:
      await openOwnStoreListing();
      return;
    default:
      logError(new Error(`navigateTo: unhandled route ${target.route}`));
  }
};
