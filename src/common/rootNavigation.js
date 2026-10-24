import { Linking } from "react-native";
import { createNavigationContainerRef, StackActions } from "@react-navigation/native";
import { getBaniByID } from "@database";
import constant from "./constant";
import { logError, logMessage } from "./firebase/crashlytics";
import { openInAppBrowser } from "./inAppBrowser";
import { storeUrlsFor } from "./openAppLink";
import {
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

// `go` performs the navigation; it is held as a function so a destination
// that needs an action rather than a plain navigate (a tab) is held the same way.
const whenReady = (go) => {
  if (navigationRef.isReady()) go();
  else pendingNotificationRoute = go;
};

const navigateWhenReady = (name, params) => whenReady(() => navigationRef.navigate(name, params));

// A tab of the main tab bar. It exists only inside MainTabs, so a plain
// navigate from a stack screen (the Reader, About) found nothing to resolve
// against and the tap did nothing. Back to the one MainTabs at the root, on
// that tab — as the Donate row does; a navigate would push a second MainTabs.
const openTabWhenReady = (screen) =>
  whenReady(() => navigationRef.dispatch(StackActions.popTo("MainTabs", { screen })));

/** Takes a notification's held destination. Called once the navigator is ready. */
export const flushPendingNotificationRoute = () => {
  if (!pendingNotificationRoute || !navigationRef.isReady()) return;
  const go = pendingNotificationRoute;
  pendingNotificationRoute = null;
  go();
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
// One tap can be reported twice: on iOS notifee and FCM both hear a tap on a
// notification the system drew, and each hands it here. Routed twice, a url or
// store campaign opened the browser or the store twice.
const SAME_TAP_MS = 2000;
let lastTap = { key: null, at: 0 };

export const navigateTo = async (incoming) => {
  const target = routeForNotification(incoming?.notification?.data);
  // Keyed on WHERE it goes, not on the payload: the two reports of one iOS tap
  // carry different extras (FCM's own keys survive in notifee's copy only).
  const key = target ? JSON.stringify(target) : null;
  const now = Date.now();
  if (key && key === lastTap.key && now - lastTap.at < SAME_TAP_MS) return;
  lastTap = { key, at: now };
  if (!target) {
    logMessage("navigateTo: notification carried no route this build knows");
    return;
  }
  switch (target.route) {
    case ROUTE_READER:
      await openBani(target);
      return;
    case ROUTE_SEVA:
      openTabWhenReady(constant.SEVA);
      return;
    case ROUTE_UPDATE:
      navigateWhenReady(constant.DATABASE_UPDATE);
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
