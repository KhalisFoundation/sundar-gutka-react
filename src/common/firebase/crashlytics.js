import {
  getCrashlytics,
  setCrashlyticsCollectionEnabled,
  crash,
  setAttribute,
  setAttributes,
  log,
  recordError,
} from "@react-native-firebase/crashlytics";

const crashlytics = getCrashlytics();

// Enable Crashlytics data collection
export const initializeCrashlytics = async () => {
  await setCrashlyticsCollectionEnabled(crashlytics, true);

  // Log a message to indicate successful initialization
  log(crashlytics, "Crashlytics initialized");
};

// Set a custom key-value pair
export const setCustomKey = (keyOrValues, value = undefined) => {
  if (typeof keyOrValues === "string" && value !== undefined) {
    setAttribute(crashlytics, keyOrValues, value);
  } else if (
    typeof keyOrValues === "object" &&
    keyOrValues !== null &&
    !Array.isArray(keyOrValues)
  ) {
    setAttributes(crashlytics, keyOrValues);
  } else {
    throw new Error(
      "Invalid arguments. Provide a string key and a value, or an object of key-value pairs."
    );
  }
};

// Log a message
export const logMessage = (message) => {
  log(crashlytics, message);
};

// Log a custom error
export const logError = (error) => {
  if (error instanceof Error) {
    recordError(crashlytics, error);
  } else {
    const newError = new Error(`Non-Error exception: ${error}`);
    recordError(crashlytics, newError);
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
