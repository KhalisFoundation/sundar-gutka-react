// The account-sync registry.
//
// Each piece of account-bound data (reminders, pothis, …) registers itself
// here with two verbs:
//
//   drain(op)   — send ONE queued outbox op and say what happened to it
//   reconcile() — bulk two-way sync: push what is pending, take back the merged
//                 truth from the account, and mark done (syncOpDone) the
//                 outbox ops the push carried — only those, since one queued
//                 while it was in flight holds a change it never saw
//
// The outbox drainer calls `drain`; useAccountSync calls `syncAll` at sign-in,
// foreground and connectivity returning, so every feature reconciles at the
// same moments and nothing needs its own timers or triggers.
import { logNetworkError } from "@common";

// What `drain` answers for one op.
export const OUTCOME_DONE = "done"; // sent; drop it
export const OUTCOME_RETRY = "retry"; // transient; keep it, back off
export const OUTCOME_CONFLICT = "conflict"; // another device won; reconcile instead
export const OUTCOME_FATAL = "fatal"; // the op itself is bad; drop it and report

const features = new Map();
// Bumped whenever the set of features changes, so a caller can tell cheaply
// that it has not (useSyncOutbox reads it on every dispatch).
let version = 0;

export const registerSyncFeature = (name, impl) => {
  features.set(name, impl);
  version += 1;
  return () => {
    if (features.get(name) === impl) {
      features.delete(name);
      version += 1;
    }
  };
};

export const syncRegistryVersion = () => version;

export const getSyncFeature = (name) => features.get(name) ?? null;
export const syncFeatureNames = () => [...features.keys()];

/** Test seam. */
export const resetSyncRegistry = () => {
  features.clear();
  version += 1;
};

let inFlight = null;

/**
 * Reconcile every registered feature. Sequential, not parallel: each feature's
 * bulk sync is one serializable transaction on the server, and the phone has
 * one network anyway. A call made while one is running joins it rather than
 * starting a second — unless `fresh`, which waits for that one and then runs
 * again: a run already out was built before the latest edits, and a caller
 * that must push everything (sign-out, before dropping the outbox) cannot be
 * answered by it. Resolves true only when every feature succeeded.
 */
export const syncAll = ({ fresh = false } = {}) => {
  if (inFlight && fresh) return inFlight.then(() => syncAll({ fresh }));
  if (inFlight) return inFlight;
  inFlight = (async () => {
    let allOk = true;
    // eslint-disable-next-line no-restricted-syntax
    for (const impl of features.values()) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const ok = await impl.reconcile?.({ fresh });
        if (ok === false) allOk = false;
      } catch (err) {
        // Keep going: one feature failing must not stop the others syncing.
        allOk = false;
        logNetworkError(err, err);
      }
    }
    return allOk;
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
};
