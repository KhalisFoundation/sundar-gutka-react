import { Linking, NativeModules, Platform } from "react-native";
import { openInAppBrowser, withinTimeout } from "./inAppBrowser";

// Opens a link that has an app behind it, trying three things in order and
// reporting which one took it:
//
//   1. the installed app          — the tile's own URL scheme first, then, on
//                                   Android, its package's launcher intent
//   2. the app's store listing    — only once the store has confirmed it HAS
//                                   the listing (a HEAD of the Play page, the
//                                   iTunes lookup for the App Store): an app
//                                   that is not published, or not on this
//                                   platform's store, must not land the user
//                                   on the store's "item not found" screen
//   3. the web                    — `url`, in the in-app browser
//
// Every field but `url` is optional and simply skips its level, so the same
// call serves a plain website (url only), an app with no store id yet, or an
// app on one platform and not the other. The fields come from the backend
// (explore-links), which is why nothing here names an app.
//
// Levels never throw: each failure is the answer "not this one", and the
// browser is the floor that always opens. The outcome is returned for
// analytics, so a tile can report whether it opened an app, a store or a page.

export const OUTCOME_APP = "app";
export const OUTCOME_STORE = "store";
export const OUTCOME_BROWSER = "browser";

// A store lookup is one small request on a tap that is leaving the app anyway;
// this is the most it may add before the tap gives up on the store.
export const STORE_LOOKUP_TIMEOUT_MS = 4000;

/** The store URLs for this platform, or null when the tile has no listing here. */
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

/**
 * The URL that opens the tile's app, from whichever field carries it.
 *
 * The column may hold a bare scheme ("shabadavali") or a whole deep link
 * ("khalisgurdham://login"). Both exist because an app whose intent filter
 * names a host — Gurdham's does — never matches "scheme://" on its own, so a
 * scheme alone would quietly fall through to the store.
 */
const appUrlOf = (tile) => {
  const value = tile.appLink || tile.iosScheme || null;
  if (!value) return null;
  return value.includes("://") ? value : `${value}://`;
};

// Level 1, first route: the tile's own URL scheme.
//
// This is the route that needs NOTHING compiled into this app, which is what
// lets a new app tile be added by a database row alone. On Android an implicit
// VIEW intent is exempt from package visibility — the system resolves it and
// the caller never sees the package — so a scheme reaches an app the manifest
// has never named. `openUrlInApp` refuses when only a browser would take it,
// and a custom scheme has no browser handler, so "not installed" comes back as
// false rather than as a browser opening on a scheme it cannot render.
//
// iOS is reached the same way, by ATTEMPTING the open rather than asking first.
// That is Apple's own guidance from iOS 27, which deprecated canOpenURL and
// halved the LSApplicationQueriesSchemes ceiling to 25 — and asking first would
// have tied every new app tile to an app release, since a scheme absent from
// that compiled-in list answers false whether or not the app is installed.
// Opening needs no declaration at all, so a link from the database reaches an
// app this build has never heard of on both platforms.
const openByLinkAndroid = async (url) => {
  const launcher = NativeModules.AppLauncher;
  if (!url || !launcher || typeof launcher.openUrlInApp !== "function") return false;
  return Boolean(await withinTimeout(launcher.openUrlInApp(url)));
};

// React Native's openURL calls UIApplication.open directly — no canOpenURL gate
// (RCTLinkingManager.mm) — and rejects when nothing can take the URL. That
// rejection IS the "not installed" answer, and the tap falls to the next level.
const openByLinkIos = async (url) => {
  if (!url) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch (_) {
    return false;
  }
};

// Level 1, second route on Android: the named package's launcher intent. Kept
// because it opens an app that declares no scheme at all — but it can only see
// a package listed in the manifest's <queries>, so it is the fallback, not the
// first thing tried.
const openInstalledApp = async (tile) => {
  const appUrl = appUrlOf(tile);
  if (Platform.OS === "ios") return openByLinkIos(appUrl);
  if (Platform.OS !== "android") return false;
  if (await openByLinkAndroid(appUrl)) return true;
  const { androidPkg } = tile;
  const launcher = NativeModules.AppLauncher;
  if (!androidPkg || !launcher || typeof launcher.openApp !== "function") return false;
  return Boolean(await withinTimeout(launcher.openApp(androidPkg)));
};

const fetchWithTimeout = async (url, init) => {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = setTimeout(() => controller?.abort(), STORE_LOOKUP_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller?.signal });
  } finally {
    clearTimeout(timer);
  }
};

// Whether the store has the listing, remembered per listing for the life of
// the process: a package does not appear on or leave the store between two
// taps, and the second tap should not pay for the lookup again. Only a
// definite answer is remembered — a store that is unreachable or erroring is
// asked again next time, and this time the answer is "no", which sends the tap
// to the web. The web is the right floor there too: with no network, neither
// the store nor the site can load, and the browser says so in place.
const listingCache = new Map();

/** Forgets every remembered store answer. For tests. */
export const clearStoreListingCache = () => listingCache.clear();

const storeHasListing = async (tile) => {
  const urls = storeUrlsFor(tile);
  if (!urls) return false;
  if (listingCache.has(urls.web)) return listingCache.get(urls.web);

  let listed;
  if (Platform.OS === "android") {
    const response = await fetchWithTimeout(urls.web, { method: "HEAD" });
    if (response.status === 404) listed = false;
    else if (response.ok) listed = true;
    else throw new Error(`Play answered ${response.status}`);
  } else {
    const lookup = `https://itunes.apple.com/lookup?id=${encodeURIComponent(tile.iosAppId)}`;
    const response = await fetchWithTimeout(lookup);
    if (!response.ok) throw new Error(`App Store lookup answered ${response.status}`);
    const body = await response.json();
    listed = Number(body?.resultCount) > 0;
  }
  listingCache.set(urls.web, listed);
  return listed;
};

// Level 2. Verified first (see above), then handed to the store APP, which
// takes the URL or refuses it — a device without a store (or one that cannot
// handle the scheme) rejects, and the browser is next. A rejection is
// deliberately not treated as an error.
const openStoreListing = async (tile) => {
  const urls = storeUrlsFor(tile);
  if (!urls) return false;
  if (!(await storeHasListing(tile))) return false;
  try {
    await Linking.openURL(urls.app);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Open an app-backed link: installed app, then its store, then the web.
 *
 * @param {{ url: string, appLink?: string|null, androidPkg?: string|null, iosAppId?: string|null }} tile
 * @param {{ barColor?: string, controlColor?: string }} [browserOptions]
 * @returns {Promise<"app"|"store"|"browser">} which level took the tap.
 */
export const openAppLink = async (tile, browserOptions = {}) => {
  try {
    if (await openInstalledApp(tile)) return OUTCOME_APP;
  } catch (_) {
    // A failed probe is not a reason to lose the tap.
  }
  try {
    if (await openStoreListing(tile)) return OUTCOME_STORE;
  } catch (_) {
    // Same: fall through to the web.
  }
  await openInAppBrowser(tile.url, browserOptions);
  return OUTCOME_BROWSER;
};

export default openAppLink;
