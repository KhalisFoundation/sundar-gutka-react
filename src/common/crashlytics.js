import crashlytics from "@react-native-firebase/crashlytics";

// Enable Crashlytics data collection
export const initializeCrashlytics = async () => {
  await crashlytics().setCrashlyticsCollectionEnabled(true);
};

export const setCustomKey = (keyOrValues, value = undefined) => {
  if (typeof keyOrValues === "string" && value !== undefined) {
    // Handle single key-value pair
    crashlytics().setAttribute(keyOrValues, value);
  } else if (
    typeof keyOrValues === "object" &&
    keyOrValues !== null &&
    !Array.isArray(keyOrValues)
  ) {
    // Handle multiple key-value pairs
    crashlytics().setAttributes(keyOrValues);
  } else {
    throw new Error(
      "Invalid arguments. Provide a string key and a value, or an object of key-value pairs."
    );
  }
};
// Log message
export const logMessage = (message) => {
  crashlytics().log(message);
};

// Log custom error
export const logError = (error) => {
  if (error instanceof Error) {
    crashlytics().recordError(error);
  } else {
    const newError = new Error(`Non-Error exception: ${error}`);
    crashlytics().recordError(newError);
  }
};

// Test function to force a crash
export const testCrash = () => {
  crashlytics().crash();
};

// Test function for non-fatal error
export const testNonFatalError = () => {
  try {
    throw new Error("Test non-fatal error for Crashlytics");
  } catch (error) {
    crashlytics().recordError(error);
  }
};
