import {
  getCrashlytics,
  setCrashlyticsCollectionEnabled,
  crash,
  setAttribute,
  log,
  recordError,
} from "@react-native-firebase/crashlytics";
import { sanitizeName } from "./helper";

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

// Log a message
export const logMessage = (message) => {
  log(crashlytics, message);
};

// Log a custom error
export const logError = (error) => {
  try {
    if (error instanceof Error) {
      recordError(crashlytics, error);
    } else {
      const newError = new Error(`Non-Error exception: ${error}`);
      recordError(crashlytics, newError);
    }
  } catch {
    // Avoid surfacing errors from logging itself
  }
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
