import {
  getCrashlytics,
  setCrashlyticsCollectionEnabled,
  crash,
  setAttribute,
  log,
  recordError,
} from "@react-native-firebase/crashlytics";
import { isNetworkFailure } from "../networkFailure";
import { sanitizeName } from "./helper";

// Re-exported so a caller reaching for one reaches for the other in the
// same import; the rule itself lives outside this file (see there for why).
export { isNetworkFailure };

const crashlytics = getCrashlytics();

// Crashlytics limits
const MAX_KEY_LENGTH = 32; // Firebase doc limit
const MAX_VALUE_LENGTH = 1024; // Firebase doc limit

const normalizeValue = (value) => {
  if (value == null) {
    return "";
  }
  if (value instanceof Error) {
    return value.message.slice(0, MAX_VALUE_LENGTH);
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value).slice(0, MAX_VALUE_LENGTH);
    } catch (err) {
      return "[unserializable]";
    }
  }
  return String(value).slice(0, MAX_VALUE_LENGTH);
};

// Turns a non-Error thrown/rejected value into a readable string for Crashlytics.
// Native module rejections and other cross-boundary errors don't always arrive
// as real Error instances — a plain { message, code } object is common. Without
// this, those all collapsed into the same useless "Non-Error exception: [object
// Object]" bucket, hiding what actually failed behind one non-diagnosable issue.
const describeNonError = (value) => {
  if (value == null) return String(value);
  if (typeof value === "object") {
    if (typeof value.message === "string" && value.message) {
      const code =
        typeof value.code === "string" || typeof value.code === "number"
          ? ` (code: ${value.code})`
          : "";
      return `${value.message}${code}`;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return Object.prototype.toString.call(value); // e.g. "[object Object]"
    }
  }
  return String(value);
};

const safeSetAttribute = (key, value) => {
  const safeKey = sanitizeName(key, MAX_KEY_LENGTH);
  if (!safeKey) return;
  try {
    setAttribute(crashlytics, safeKey, normalizeValue(value));
  } catch {
    // Swallow errors to avoid impacting app flow
  }
};

const safeSetAttributes = (keyValues) => {
  if (!keyValues || typeof keyValues !== "object") return;
  const entries = Object.entries(keyValues).slice(0, 64); // Crashlytics supports up to 64 keys
  entries.forEach(([key, value]) => safeSetAttribute(key, value));
};

// Enable Crashlytics data collection
export const initializeCrashlytics = async () => {
  try {
    await setCrashlyticsCollectionEnabled(crashlytics, true);
    log(crashlytics, "Crashlytics initialized");
  } catch {
    // Do not block app startup if Crashlytics fails to init
  }
};

// Set a custom key-value pair
export const setCustomKey = (keyOrValues, value = undefined) => {
  if (typeof keyOrValues === "string" && value !== undefined) {
    safeSetAttribute(keyOrValues, value);
    return;
  }

  if (typeof keyOrValues === "object" && keyOrValues !== null && !Array.isArray(keyOrValues)) {
    safeSetAttributes(keyOrValues);
  }
};

// Log a message.
//
// Swallows its own failures, exactly as `logError` does. It is reached from the
// catch blocks of SSO, sync and every dashboard section (see logNetworkError),
// and a logger that can throw there would turn a handled offline case into a
// rejected promise in the feature that called it.
export const logMessage = (message) => {
  try {
    log(crashlytics, message);
  } catch {
    // Never let logging break the path that called it.
  }
};

// Log a custom error. Accepts either a single error/message, or a
// "context, error" pair (many call sites do `logError("X failed:", err)`) —
// without this second form the context string was recorded as the whole
// error and the real `err` (and its message/stack) was silently dropped.
//
// Whichever argument is a real Error is recorded AS ITSELF, so its own stack
// decides where the issue groups; the other argument becomes a breadcrumb.
// This matters for the error boundary, which calls onError(error,
// componentStack): folding that ever-changing component stack into a new
// Error's message pointed every render crash at this file and split each one
// into many issues.
const MAX_BREADCRUMB_LENGTH = 1000;
const breadcrumb = (value) => {
  try {
    const text = value instanceof Error ? value.message : describeNonError(value);
    log(crashlytics, text.slice(0, MAX_BREADCRUMB_LENGTH));
  } catch {
    // A breadcrumb is best-effort.
  }
};

// A rejection from a native module (React Native gives these a native stack
// and userInfo). Its JS stack is the bridge's, the same whichever call failed,
// so recorded as-is, failures from different callers (play, pause, seek, ...)
// would all merge into one issue.
const isNativeRejection = (err) =>
  err instanceof Error &&
  (Array.isArray(err.nativeStackAndroid) ||
    Array.isArray(err.nativeStackIOS) ||
    err.userInfo !== undefined);

export const logError = (error, extra) => {
  try {
    if (extra !== undefined) {
      // A phone with no connection is not a bug (see logNetworkError). Callers
      // written as logError("X failed", err) get the same treatment: a
      // breadcrumb, not an issue, so an offline launch doesn't file one per
      // call site that fetches.
      if (isNetworkFailure(extra)) {
        breadcrumb(
          `${describeNonError(error)}: ${
            extra instanceof Error ? extra.message : describeNonError(extra)
          }`
        );
        return;
      }
      if (extra instanceof Error) {
        if (isNativeRejection(extra) && !(error instanceof Error)) {
          // Made here, so its stack is the caller's and each call site groups on
          // its own; the context names the call and the original rides as cause.
          const code = extra.code !== undefined ? ` (code: ${extra.code})` : "";
          const recorded = new Error(`${describeNonError(error)}: ${extra.message}${code}`);
          recorded.cause = extra;
          recordError(crashlytics, recorded);
          return;
        }
        breadcrumb(error);
        recordError(crashlytics, extra);
        return;
      }
      if (error instanceof Error) {
        breadcrumb(extra);
        recordError(crashlytics, error);
        return;
      }
      recordError(crashlytics, new Error(`${describeNonError(error)} ${describeNonError(extra)}`));
      return;
    }
    if (error instanceof Error) {
      recordError(crashlytics, error);
    } else {
      const newError = new Error(`Non-Error exception: ${describeNonError(error)}`);
      recordError(crashlytics, newError);
    }
  } catch {
    // Avoid surfacing errors from logging itself
  }
};

/**
 * Report a failure from something that talks to the network.
 *
 * A phone with no signal is not a bug, and every caller of this already has an
 * answer for it — a cache, a bundled copy, a "check your connection" state. Yet
 * each one still recorded a Crashlytics ERROR on the way past, so one launch in
 * flight mode filed a dozen non-fatals that no one could ever act on and that
 * buried the faults that mattered.
 *
 * A connection failure is therefore logged as a breadcrumb: still there in the
 * report of a later crash, where it is genuinely useful context, but not an
 * issue of its own. Anything else is recorded exactly as `logError` would.
 *
 * @param {string|Error} message What to record — pass the same text you would
 *   have given `logError`, so a real fault keeps its existing Crashlytics
 *   grouping.
 * @param {*} error The RAW caught value. This is what decides which way it
 *   goes, so it must be the original — not the message built from it.
 */
export const logNetworkError = (message, error) => {
  const text = message instanceof Error ? message.message : String(message);
  if (isNetworkFailure(error)) {
    logMessage(text);
    return;
  }
  if (!(error instanceof Error)) {
    logError(message instanceof Error ? message : new Error(text));
    return;
  }
  // Keep the call site's text as the title, so the issue groups where it always
  // did, but carry the ORIGINAL error's frames, code and cause: those say where
  // it actually failed, which a fresh Error made here would not.
  const code = error.code !== undefined ? ` (code: ${error.code})` : "";
  const recorded = new Error(`${text}${code}`);
  if (typeof error.stack === "string") {
    const frames = error.stack.split("\n").slice(1).join("\n");
    recorded.stack = `Error: ${recorded.message}${frames ? `\n${frames}` : ""}`;
  }
  recorded.cause = error;
  logError(recorded);
};

// Test function to force a crash
export const testCrash = () => {
  crash(crashlytics);
};

// Test function for non-fatal error
export const testNonFatalError = () => {
  try {
    throw new Error("Test non-fatal error for Crashlytics");
  } catch (error) {
    recordError(crashlytics, error);
  }
};
