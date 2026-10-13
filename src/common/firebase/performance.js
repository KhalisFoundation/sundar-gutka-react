// Firebase Performance Monitoring — custom screen/route traces.
//
// Backed by @react-native-firebase/perf. Every call is wrapped so a perf
// failure (collection disabled, native module not ready, offline, etc.) is
// logged and swallowed — performance instrumentation must never crash or block
// the app. The navigation layer starts a trace per route and stops it on the
// next screen change (see src/navigation/index.jsx).
import perf from "@react-native-firebase/perf";
import { logError } from "./crashlytics";

// Turn Performance Monitoring collection on or off to match the user's
// Statistics setting. Applied once the persisted settings have loaded (app.js
// handleBeforeLift) and again whenever the setting changes (allowTracking), so
// someone who opted out gets no screen traces or network timing uploaded. The
// SDK persists the choice, so it also holds from the start of later launches.
export const initializePerformanceMonitoring = async (enabled) => {
  try {
    await perf().setPerformanceCollectionEnabled(Boolean(enabled));
  } catch (error) {
    logError(new Error(`Performance init failed - ${error?.message || "Unknown error"}`));
  }
};

// Start a custom trace for a screen/route. Returns the Trace handle, or null on
// failure so callers can no-op safely.
export const startPerformanceTrace = async (routeName) => {
  try {
    return await perf().startTrace(`route_${routeName}`);
  } catch (error) {
    logError(new Error(`startTrace failed - ${error?.message || "Unknown error"}`));
    return null;
  }
};

// Stop a running trace (the handle returned by startPerformanceTrace).
export const stopTrace = async (trace) => {
  try {
    if (trace) await trace.stop();
  } catch (error) {
    logError(new Error(`stopTrace failed - ${error?.message || "Unknown error"}`));
  }
};

// Clear the stored trace reference between routes.
export const resetTrace = () => null;
