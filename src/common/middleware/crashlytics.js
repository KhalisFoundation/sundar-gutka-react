import { setCustomKey } from "../crashlytics";

// Helper function to safely stringify values
const safeStringify = (value) => {
  // null or undefined
  if (value == null) {
    return "";
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "string") {
    return value;
  }
  // array or object
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

// Function to update Crashlytics with current state
const updateCrashlyticsState = (state) => {
  const crashlyticsState = {};
  // Update each state value in Crashlytics
  Object.entries(state).forEach(([key, value]) => {
    const crashlyticsKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    crashlyticsState[crashlyticsKey] = safeStringify(value);
  });
  setCustomKey(crashlyticsState);
};

// Crashlytics middleware
const crashlyticsMiddleware = (store) => (next) => (action) => {
  // Track the action type
  setCustomKey("last-action", action.type);

  // Track action value/payload
  const actionValue = action.value !== undefined ? action.value : action.payload;
  if (actionValue !== undefined) {
    const actionKey = action.type.toLowerCase().replace(/_/g, "-");
    setCustomKey(actionKey, safeStringify(actionValue));
  }

  // Let the action go through
  const result = next(action);

  // After state update, track the entire state
  const newState = store.getState();
  updateCrashlyticsState(newState);

  return result;
};

export default crashlyticsMiddleware;
