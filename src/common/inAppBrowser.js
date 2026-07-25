import { Linking } from "react-native";
import { InAppBrowser } from "react-native-inappbrowser-reborn";

const BRAND_COLOR = "#113979";
const BRAND_CONTRAST = "#FAF9F6";

/**
 * Open a URL in the in-app browser with the app's brand chrome, falling back to
 * the system browser when the in-app browser isn't available (and again if the
 * open throws). Centralizes the option set previously duplicated across the
 * audio "request audio" link and the Seva donation flow.
 *
 * @param {string} url
 * @param {{ barColor?: string, controlColor?: string }} [options]
 */
export const openInAppBrowser = async (url, options = {}) => {
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
