import { setCustomKey } from "../firebase/crashlytics";

const MAX_STRING_LENGTH = 512;
const MAX_STATE_KEYS = 10;

// Helper function to safely stringify values
const safeStringify = (value) => {
  if (value == null) return "";
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return String(value).slice(0, MAX_STRING_LENGTH);
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value).slice(0, MAX_STRING_LENGTH);
    } catch {
      return "[unserializable]";
    }
  }
  return String(value).slice(0, MAX_STRING_LENGTH);
};

const summarizeState = (state) => {
  const summary = {};
  let count = 0;
  Object.entries(state || {}).some(([key, value]) => {
    if (count >= MAX_STATE_KEYS) return true;
    if (value === undefined) return false;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      const crashlyticsKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      summary[crashlyticsKey] = safeStringify(value);
      count += 1;
    }
    return false;
  });
  return summary;
};

// Crashlytics middleware
const crashlyticsMiddleware = (store) => (next) => (action) => {
  // Track the action type
  setCustomKey("last-action", action.type);

  // Track action value/payload
  const actionValue = action.value !== undefined ? action.value : action.payload;
  if (actionValue !== undefined) {
    setCustomKey("last-action-value", safeStringify(actionValue));
  }

  // Let the action go through
  const result = next(action);

  // After state update, track a small summary of the state to avoid overflow
  const stateSummary = summarizeState(store.getState());
  if (Object.keys(stateSummary).length > 0) {
    setCustomKey(stateSummary);
  }

  return result;
};

export default crashlyticsMiddleware;
