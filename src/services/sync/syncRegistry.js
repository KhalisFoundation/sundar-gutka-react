// The account-sync registry.
//
// Each piece of account-bound data (reminders, pothis, …) registers itself
// here with two verbs:
//
//   drain(op)   — send ONE queued outbox op and say what happened to it
//   reconcile() — bulk two-way sync: push what is pending, take back the merged
//                 truth from the account
//
// The outbox drainer calls `drain`; the dashboard's own sync (sign-in,
// foreground, connectivity returning, pull-to-refresh) calls `syncAll`, so
// every feature reconciles at the same moments the dashboard does and nothing
// needs its own timers or triggers.
import { logNetworkError } from "@common";

// What `drain` answers for one op.
export const OUTCOME_DONE = "done"; // sent; drop it
export const OUTCOME_RETRY = "retry"; // transient; keep it, back off
export const OUTCOME_CONFLICT = "conflict"; // another device won; reconcile instead
export const OUTCOME_FATAL = "fatal"; // the op itself is bad; drop it and report

const features = new Map();

export const registerSyncFeature = (name, impl) => {
  features.set(name, impl);
  return () => {
    if (features.get(name) === impl) features.delete(name);
  };
};

export const getSyncFeature = (name) => features.get(name) ?? null;
export const syncFeatureNames = () => [...features.keys()];

/** Test seam. */
export const resetSyncRegistry = () => {
  features.clear();
};

let inFlight = null;

/**
 * Reconcile every registered feature. Sequential, not parallel: each feature's
 * bulk sync is one serializable transaction on the server, and the phone has
 * one network anyway. A call made while one is running joins it rather than
 * starting a second. Resolves true only when every feature succeeded.
 */
export const syncAll = () => {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    let allOk = true;
    // eslint-disable-next-line no-restricted-syntax
    for (const impl of features.values()) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const ok = await impl.reconcile?.();
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
