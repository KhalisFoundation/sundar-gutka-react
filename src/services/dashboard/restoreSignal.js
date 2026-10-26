import { useSyncExternalStore } from "react";

// A one-value external store: "how many times has a restore settled".
//
// useDashboardSync used to live in DashboardScreen and hand this back as its
// return value, which is why it had to be mounted there. That coupling is the
// bug this module exists to break: with the hook mounted on the screen, sync
// only ran while that screen was mounted — sign in anywhere else and nothing
// was ever pushed or pulled for the account.
//
// The hook now runs once at app level (GlobalServices) and BUMPS this instead.
// DashboardScreen subscribes. Same effect as the old return value — sections
// that fetch on mount are told to look again once the restore's SQLite writes
// have landed — without either side owning the other.
//
// Deliberately a module-level store rather than a context: GlobalServices sits
// above ThemeProvider and Navigation in the tree, so a provider added there
// would have to wrap the entire app to reach one screen.

let tick = 0;
const listeners = new Set();

/** Called by useDashboardSync once a restore attempt has fully settled. */
export const bumpRestoreTick = () => {
  tick += 1;
  listeners.forEach((notify) => notify());
};

export const getRestoreTick = () => tick;

export const subscribeRestoreTick = (notify) => {
  listeners.add(notify);
  return () => listeners.delete(notify);
};

/** Test seam — resets both the counter and its subscribers. */
export const resetRestoreTick = () => {
  tick = 0;
  listeners.clear();
};

/**
 * Re-renders the caller each time a restore settles. Returns the count, so it
 * can be used directly as an effect dependency the way the old return value was.
 */
export const useRestoreTick = () =>
  useSyncExternalStore(subscribeRestoreTick, getRestoreTick, getRestoreTick);

export default useRestoreTick;
