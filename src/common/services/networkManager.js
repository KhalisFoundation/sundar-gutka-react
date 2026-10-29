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
 * and let the OS push changes in real time. The only thing configured here is
 * how "is there REAL internet" (captive-portal / connected-but-no-internet) is
 * validated:
 *   • Android → `useNativeReachability: true` uses the OS-validated signal
 *     (zero extra network requests — identical to native apps).
 *   • iOS     → falls back to a lightweight 204 probe (the same technique Chrome
 *     and the OS use for captive-portal detection), run on NetInfo's adaptive
 *     schedule (slow when healthy, fast when struggling) — never on our own timer.
 *
 * This layer is intentionally transport-agnostic: it answers "do we have
 * internet", NOT "is the audio CDN up". Feature-specific reachability (audio,
 * and future non-audio features) should react to real request failures rather
 * than gate on a preflight check.
 */

// A tiny, globally-distributed 204 endpoint. Used only on iOS (Android uses the
// native validated capability). Same endpoint family the OS itself probes.
const REACHABILITY_URL = "https://clients3.google.com/generate_204";

let isConfigured = false;

export const configureNetwork = () => {
  // Guard against double-configuration (fast refresh / repeated imports).
  if (isConfigured) return;
  isConfigured = true;

  NetInfo.configure({
    reachabilityUrl: REACHABILITY_URL,
    reachabilityMethod: "HEAD",
    // Prefer the OS's own validated-internet signal where available (Android).
    // On iOS this has no effect and the 204 probe below is used instead.
    useNativeReachability: true,
    reachabilityTest: async (response) => response.status === 204,
    // Healthy → re-validate infrequently to save battery/data.
    reachabilityLongTimeout: 60 * 1000,
    // Struggling/unsure → re-validate quickly so recovery is near-instant.
    reachabilityShortTimeout: 5 * 1000,
    // Abort a hung probe so a stalled connection doesn't wedge the state.
    reachabilityRequestTimeout: 15 * 1000,
    reachabilityShouldRun: () => true,
    // We never need the Wi-Fi SSID — skip it to avoid location-permission prompts.
    shouldFetchWiFiSSID: false,
  });
};

export default configureNetwork;
