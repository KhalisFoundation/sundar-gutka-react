import AsyncStorage from "@react-native-async-storage/async-storage";
import { DASHBOARD_LOCAL_MUTATED_AT_KEY } from "./syncKeys";

// A one-way doorbell between "something changed" and "sync should run".
//
// The sync hook lives at app level (GlobalServices). The things that make data
// worth syncing do not: a reading session ends deep inside the Reader, a
// listening session inside the audio player, a manual refresh on the Dashboard.
// None of those should import the sync hook — it would drag Redux, DeviceInfo
// and the network layer into a component that just finished a timer.
//
// So they ring this instead, and the hook is what listens. Same shape as
// restoreSignal, and deliberately a module-level store rather than context:
// GlobalServices sits above ThemeProvider and the navigator, so a provider
// would have to wrap the entire app to reach one screen.

const pushListeners = new Set();
const pullListeners = new Set();

/**
 * "Local data changed; sync it when convenient."
 *
 * Fire-and-forget by design. The caller has just finished writing to SQLite and
 * must not be made to wait on, or care about, a network request — the listener
 * debounces and decides for itself when to actually go.
 */
export const requestPush = (reason) => {
  // Stamp FIRST, and unconditionally. Signed out or offline there is no
  // listener that can do anything useful, but the change still happened — and
  // when a session or a connection arrives, this timestamp is the only evidence
  // that the local copy is newer than the account's. Not awaited: the caller
  // has just finished saving and must not wait on storage.
  AsyncStorage.setItem(DASHBOARD_LOCAL_MUTATED_AT_KEY, String(Date.now())).catch(() => {});

  pushListeners.forEach((notify) => {
    try {
      notify(reason);
    } catch (_) {
      /* a broken listener must never break the caller's save path */
    }
  });
};

export const subscribePush = (notify) => {
  pushListeners.add(notify);
  return () => pushListeners.delete(notify);
};

/**
 * "Sync now, both ways, and do not negotiate."
 *
 * Every automatic path is guarded — a 60-second cooldown, a five-minute refresh
 * throttle, a skip when the payload is byte-identical, another when the server's
 * snapshot is no newer than ours. Those guards are right for background work and
 * wrong the moment a person deliberately pulls the screen down: they asked, and
 * an answer of "no, too soon" is indistinguishable from being broken.
 *
 * So this bypasses all of them. It pushes first and pulls second — that order
 * matters, because pushing last would mean the fresh local state we just sent up
 * is the thing we then fail to pull down.
 *
 * AWAITABLE, unlike the push side: pull-to-refresh needs to know when to stop
 * spinning, and the honest answer is "when the sync finished".
 */
export const requestPull = async (reason) => {
  await Promise.all(
    [...pullListeners].map(async (notify) => {
      try {
        await notify(reason);
      } catch (_) {
        /* the spinner should stop even if the sync failed */
      }
    })
  );
};

export const subscribePull = (notify) => {
  pullListeners.add(notify);
  return () => pullListeners.delete(notify);
};

/** Test seam. */
export const resetSyncSignal = () => {
  pushListeners.clear();
  pullListeners.clear();
};
