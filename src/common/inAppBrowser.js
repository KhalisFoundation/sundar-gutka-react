import { Linking, NativeModules, Platform } from "react-native";
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import { brandMarks } from "@theme/palette";

const BRAND_COLOR = brandMarks.inAppBrowser.chrome;
const BRAND_CONTRAST = brandMarks.inAppBrowser.onChrome;

// A link is opened in the app that owns it when that app is installed — an
// Instagram profile in Instagram, a channel in YouTube — and in the in-app
// browser otherwise. Nothing here names a service, so a link the backend adds
// tomorrow gets the same treatment with no app release:
//
//   Android  every https link is offered to the system with
//            FLAG_ACTIVITY_REQUIRE_NON_BROWSER (see AppLauncherModule); the OS
//            opens the owning app or refuses, and a refusal means the browser.
//   iOS      has no such flag. The only installed-check is `canOpenURL` on the
//            app's URL scheme, and iOS only answers for schemes declared in
//            Info.plist (LSApplicationQueriesSchemes) at build time. So the
//            scheme is DERIVED from the link's own domain — instagram.com asks
//            for instagram://, substack.com for substack:// — and the plist
//            ships a broad list of them once. A domain whose scheme is not
//            declared, or does not follow its name, simply reads as "not
//            installed" and takes the in-app browser as before.
//
// The link itself is always opened as its https URL — a universal link on
// iOS, an app link on Android — so the app decides where it lands and nothing
// here needs each service's private URL grammar.

// Domains whose app scheme is not their own name.
const SCHEME_EXCEPTIONS = {
  "x.com": ["twitter"],
  "twitter.com": ["twitter"],
  "facebook.com": ["fb"],
  "fb.com": ["fb"],
  "youtu.be": ["youtube"],
  "t.me": ["tg"],
  "messenger.com": ["fb-messenger"],
  // Threads still answers to its codename.
  "threads.net": ["barcelona"],
  "threads.com": ["barcelona"],
  "signal.org": ["sgnl"],
  "tiktok.com": ["tiktok", "snssdk1233"],
};

const hostOf = (url) => {
  const match = /^https?:\/\/([^/?#]+)/i.exec(String(url || ""));
  if (!match) return null;
  // Drop any port and a leading "www.".
  return match[1]
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
};

// "khalisfoundation.substack.com" → "substack.com". Two labels is right for
// every service this is for; a country-code second level (".co.uk") would
// yield a scheme that is not declared, which is the harmless outcome.
const registrableDomain = (host) => host.split(".").slice(-2).join(".");

/**
 * The URL schemes worth asking iOS about for a link, most likely first, or an
 * empty list for anything that is not an http(s) URL.
 */
export const schemesForUrl = (url) => {
  const host = hostOf(url);
  if (!host) return [];
  const domain = registrableDomain(host);
  if (SCHEME_EXCEPTIONS[domain]) return SCHEME_EXCEPTIONS[domain];
  const [name] = domain.split(".");
  return name ? [name] : [];
};

const isHttpUrl = (url) => /^https?:\/\//i.test(String(url || ""));

// The app-first attempt is a bonus on top of a link that must always open.
// Every way it can FAIL already ends in the browser: the native side resolves
// false on any exception, and a throw here is caught below. This closes the
// one remaining gap — a call that never comes back at all — by treating
// "still no answer" as "no app". The cap is deliberately loose: an intent
// resolution or a canOpenURL read takes milliseconds, so the only thing that
// reaches it is a genuine hang — and a cap tight enough to fire on a merely
// slow device would open the browser on top of an app that then launches.
export const APP_ATTEMPT_TIMEOUT_MS = 1500;
export const withinTimeout = (promise) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), APP_ATTEMPT_TIMEOUT_MS);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(false);
      }
    );
  });

// True once the link is open in an installed app; false when the browser
// should take it.
const openInInstalledApp = async (url) => {
  if (!isHttpUrl(url)) return false;

  if (Platform.OS === "android") {
    const launcher = NativeModules.AppLauncher;
    if (!launcher || typeof launcher.openUrlInApp !== "function") return false;
    return Boolean(await withinTimeout(launcher.openUrlInApp(url)));
  }

  // canOpenURL REJECTS for a scheme the plist does not declare — that is the
  // "not installed" answer here, not an error. Probed one at a time, in order:
  // a service with two schemes is asked about its current one first.
  const schemes = schemesForUrl(url);
  // eslint-disable-next-line no-restricted-syntax
  for (const scheme of schemes) {
    // eslint-disable-next-line no-await-in-loop
    const installed = await withinTimeout(Linking.canOpenURL(`${scheme}://`));
    if (installed) {
      // eslint-disable-next-line no-await-in-loop
      await Linking.openURL(url);
      return true;
    }
  }
  return false;
};

/**
 * Open a URL: in the service's own app when that app is installed, else in
 * the in-app browser with the app's brand chrome, else — should the browser
 * itself be unavailable or throw — the system browser. One entry point for
 * every outbound link, so they all behave the same.
 *
 * @param {string} url
 * @param {{ barColor?: string, controlColor?: string }} [options]
 */
export const openInAppBrowser = async (url, options = {}) => {
  try {
    if (await openInInstalledApp(url)) return;
  } catch (_) {
    // A failed probe or hand-off is not a reason to lose the link.
  }

  const { barColor = BRAND_COLOR, controlColor = BRAND_CONTRAST } = options;
  // Skip isAvailable() — on Android it uses an async Chrome Custom Tabs service
  // binding that isn't ready on the first call, causing a false-negative that
  // opens the system browser instead. Calling open() directly and catching any
  // error eliminates the race; the fallback behaviour is identical.
  try {
    await InAppBrowser.open(url, {
      dismissButtonStyle: "cancel",
      preferredBarTintColor: barColor,
      preferredControlTintColor: controlColor,
      readerMode: false,
      animated: true,
      modalPresentationStyle: "fullScreen",
      modalTransitionStyle: "coverVertical",
      modalEnabled: true,
      showTitle: true,
      toolbarColor: barColor,
      secondaryToolbarColor: controlColor,
      navigationBarColor: barColor,
      enableUrlBarHiding: true,
      enableDefaultShare: false,
      forceCloseOnRedirection: false,
      // Android: without this, the library adds FLAG_ACTIVITY_NO_HISTORY to the
      // Chrome Custom Tab, which destroys the tab the instant the app is
      // backgrounded (Home / app-switch) — losing the donation/payment page.
      // Keeping it in recents lets the tab survive backgrounding so the user
      // can switch away and return with full context, like Gmail/Instagram.
      showInRecents: true,
    });
  } catch (_) {
    Linking.openURL(url).catch(() => {});
  }
};

export default openInAppBrowser;
