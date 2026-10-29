import { setCustomKey } from "../firebase/crashlytics";

const MAX_STRING_LENGTH = 512;
const MAX_STATE_KEYS = 10;

// Actions that fire on every audio tick or every scroll frame — logging them to
// Crashlytics on each dispatch would hammer the native bridge and drain the CPU
// on low-end devices without adding any useful crash context.
const HIGH_FREQUENCY_ACTIONS = new Set(["SET_AUDIO_PROGRESS", "SET_SCROLL_POSITION"]);

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
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(state || {})) {
    if (count >= MAX_STATE_KEYS) break;
    // eslint-disable-next-line no-continue
    if (value === undefined) continue;

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      const crashlyticsKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      summary[crashlyticsKey] = safeStringify(value);
      count += 1;
    }
  }
  return summary;
};

// Crashlytics middleware
const crashlyticsMiddleware = (store) => (next) => (action) => {
  // Skip high-frequency actions to avoid hammering the native Crashlytics bridge.
  if (HIGH_FREQUENCY_ACTIONS.has(action.type)) {
    return next(action);
  }

  // Let the action go through first so React can re-render immediately.
  const result = next(action);

  // Defer ALL Crashlytics native bridge calls to the next idle tick.
  // On cold start the Crashlytics bridge is not yet warm, so synchronous
  // setAttribute calls block the JS thread and cause a visible ~200 ms lag
  // on the very first toggle/dispatch. setImmediate ensures the UI updates
  // (Redux state + React re-render) complete before any native I/O happens.
  setImmediate(() => {
    // Track the action type and value
    setCustomKey("last-action", action.type);

    const actionValue = action.value !== undefined ? action.value : action.payload;
    if (actionValue !== undefined) {
      setCustomKey("last-action-value", safeStringify(actionValue));
    }

    // Track a small summary of the post-action state
    const stateSummary = summarizeState(store.getState());
    if (Object.keys(stateSummary).length > 0) {
      setCustomKey(stateSummary);
    }
  });

  return result;
};

export default crashlyticsMiddleware;
