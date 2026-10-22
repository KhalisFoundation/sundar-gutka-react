import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, NativeModules, Platform } from "react-native";

// Whether a WebView can be created on this phone.
//
// Android renders every WebView through an updatable provider package. When
// it is disabled, uninstalled or mid-update, constructing a WebView throws
// from inside the native view constructor — no JavaScript boundary sees it and
// the process dies. The Reader IS a WebView, so on such a phone every bani was
// a crash. The native probe (WebViewAvailabilityModule) answers the question
// without mounting anything; a screen asks it first and shows
// <WebViewUnavailable/> instead when the answer is no.
//
// iOS ships WebKit with the system, so the answer there is always yes.

/** The provider's Play listing — where a user goes to install or update it. */
export const WEBVIEW_PROVIDER_PACKAGE = "com.google.android.webview";

// A "yes" holds for the life of the process; a "no" is asked again, so a user
// who installs the provider and comes back is not stuck on the notice.
let knownAvailable = false;

/** Forgets the remembered answer. For tests. */
export const clearWebViewAvailabilityCache = () => {
  knownAvailable = false;
};

const settled = () => Platform.OS !== "android" || knownAvailable;

/** @returns {Promise<boolean>} */
export const isWebViewAvailable = async () => {
  if (settled()) return true;
  const probe = NativeModules.WebViewAvailability?.isAvailable;
  // A build without the module (or a probe that itself fails) has nothing to
  // gate on; the WebView mounts as it always did.
  if (typeof probe !== "function") return true;
  try {
    const available = Boolean(await probe());
    if (available) knownAvailable = true;
    return available;
  } catch (_) {
    return true;
  }
};

/** Opens the provider's store listing, falling back to its web page. */
export const openWebViewInstaller = async () => {
  try {
    await Linking.openURL(`market://details?id=${WEBVIEW_PROVIDER_PACKAGE}`);
  } catch (_) {
    const web = `https://play.google.com/store/apps/details?id=${WEBVIEW_PROVIDER_PACKAGE}`;
    await Linking.openURL(web).catch(() => {});
  }
};

/**
 * `available` is null while the probe runs, then true or false. While false,
 * a return to the foreground asks again — the user was most likely away
 * installing the provider — and `recheck` asks on demand.
 *
 * @returns {{ available: boolean|null, recheck: () => void }}
 */
export const useWebViewAvailable = () => {
  const [available, setAvailable] = useState(settled() ? true : null);

  const recheck = useCallback(() => {
    let active = true;
    isWebViewAvailable().then((ok) => {
      if (active) setAvailable(ok);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(recheck, [recheck]);

  useEffect(() => {
    if (available !== false) return undefined;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") recheck();
    });
    return () => sub.remove();
  }, [available, recheck]);

  return { available, recheck };
};

export default useWebViewAvailable;
