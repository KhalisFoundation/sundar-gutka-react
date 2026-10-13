import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";

/**
 * S-tier network configuration — modelled on how Spotify / YouTube / YT Music
 * detect connectivity natively on both platforms.
 *
 * Under the hood `@react-native-community/netinfo` is a thin bridge over the
 * exact native APIs those apps use:
 *   • iOS     → NWPathMonitor (Network framework) — push-based path changes.
 *   • Android → ConnectivityManager.registerDefaultNetworkCallback +
 *               NET_CAPABILITY_VALIDATED — the OS itself validates real internet.
 *
 * So we do NOT poll a URL on a timer. We subscribe once (see NetworkProvider)
 * and let the OS push changes in real time. How "is there REAL internet"
 * (captive-portal / connected-but-no-internet) is validated:
 *   • Android → `useNativeReachability: true` uses the OS-validated signal
 *     (zero extra network requests — identical to native apps).
 *   • iOS     → not validated. The OS offers no such signal, and NetInfo's
 *     fallback is a request to a probe URL every minute. A third-party probe
 *     (e.g. Google's generate_204) reads as offline wherever that host is
 *     blocked, so no probe runs and iOS goes by the connection alone. See
 *     REACHABILITY_VALIDATED, which NetworkProvider uses to ignore
 *     isInternetReachable on iOS.
 *
 * This layer is intentionally transport-agnostic: it answers "do we have
 * internet", NOT "is the audio CDN up". Feature-specific reachability (audio,
 * and future non-audio features) should react to real request failures rather
 * than gate on a preflight check.
 */

// Whether isInternetReachable is a real, OS-validated answer on this platform.
// With the probe off, NetInfo reports iOS as unreachable (false), not unknown,
// so it must not be read there.
export const REACHABILITY_VALIDATED = Platform.OS === "android";

let isConfigured = false;

export const configureNetwork = () => {
  // Guard against double-configuration (fast refresh / repeated imports).
  if (isConfigured) return;
  isConfigured = true;

  NetInfo.configure({
    // Prefer the OS's own validated-internet signal where available (Android).
    useNativeReachability: true,
    // Never send a probe request (see above). Android always reports a native
    // boolean, so NetInfo never falls back to the probe there anyway.
    reachabilityShouldRun: () => false,
    // We never need the Wi-Fi SSID — skip it to avoid location-permission prompts.
    shouldFetchWiFiSSID: false,
  });
};

export default configureNetwork;
