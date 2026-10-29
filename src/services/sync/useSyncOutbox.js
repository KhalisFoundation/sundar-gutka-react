import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useDispatch, useSelector, useStore } from "react-redux";
import { clearSyncFeature, syncOpDone, syncOpFailed, syncOpSending } from "@common/actions";
import { nextAttemptAt, nextRunnable } from "@common/sync/outboxModel";
import { logError, logMessage, logNetworkError, useNetwork } from "@common";
import {
  getSyncFeature,
  OUTCOME_CONFLICT,
  OUTCOME_DONE,
  OUTCOME_RETRY,
  syncFeatureNames,
} from "./syncRegistry";

// Drains the outbox.
//
// Every change to account data lands in the persisted `syncOutbox` slice
// first (see common/sync/outboxModel) and this hook sends it: one operation
// at a time per feature, in the order it was made, retrying with backoff when
// the network is away. On a conflict — the server refused because another
// device changed the same thing first — the feature's queue is handed to its
// bulk reconcile, which pushes the current local state and takes back the
// merged result; the queued ops are then moot and are dropped.
//
// Mounted once, in GlobalServices, so a change made on any screen goes up
// whether or not that screen is still open.
const useSyncOutbox = () => {
  const store = useStore();
  const dispatch = useDispatch();
  const outbox = useSelector((state) => state.syncOutbox);
  const signedIn = useSelector((state) => state.auth?.status === "signedIn");
  const { isOnline } = useNetwork();
  // One drain per feature at a time; a second trigger while one is running
  // simply asks for another pass when it finishes.
  const runningRef = useRef(new Set());
  const rerunRef = useRef(new Set());
  const timersRef = useRef(new Map());
  const signedInRef = useRef(signedIn);
  signedInRef.current = signedIn;

  const drainFeature = useCallback(
    async (name) => {
      if (runningRef.current.has(name)) {
        rerunRef.current.add(name);
        return;
      }
      runningRef.current.add(name);
      try {
        const impl = getSyncFeature(name);
        if (!impl) return;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (!signedInRef.current) return;
          const op = nextRunnable(store.getState().syncOutbox, name);
          if (!op) break;
          dispatch(syncOpSending(op.id));
          let outcome;
          try {
            // eslint-disable-next-line no-await-in-loop
            outcome = await impl.drain(op);
          } catch (err) {
            logNetworkError(err, err);
            outcome = OUTCOME_RETRY;
          }
          if (outcome === OUTCOME_DONE) {
            dispatch(syncOpDone(op.id));
          } else if (outcome === OUTCOME_RETRY) {
            dispatch(syncOpFailed(op.id, "retry"));
            break;
          } else if (outcome === OUTCOME_CONFLICT) {
            // The bulk sync carries every pending change up in one go, so the
            // queue for this feature is finished with, whatever it held.
            dispatch(clearSyncFeature(name));
            // eslint-disable-next-line no-await-in-loop
            const ok = await impl.reconcile?.();
            if (!ok) logMessage(`sync: ${name} reconcile after conflict did not complete`);
            break;
          } else {
            logError(new Error(`sync: ${name} op ${op.kind}/${op.key} rejected by the server`));
            dispatch(syncOpDone(op.id));
          }
        }
      } finally {
        runningRef.current.delete(name);
        if (rerunRef.current.delete(name)) drainFeature(name);
      }
    },
    [store, dispatch]
  );

  const drainAll = useCallback(() => {
    syncFeatureNames().forEach((name) => drainFeature(name));
  }, [drainFeature]);

  // Something new in the outbox, or a retry time arriving.
  useEffect(() => {
    if (!signedIn || !isOnline) return undefined;
    drainAll();
    // Arm a timer for the soonest retry of each feature, so a change made in
    // a tunnel goes up on its own once the backoff lapses — not only when the
    // user next touches something.
    const timers = timersRef.current;
    syncFeatureNames().forEach((name) => {
      const at = nextAttemptAt(outbox, name);
      const existing = timers.get(name);
      if (existing) clearTimeout(existing);
      if (at == null) return;
      timers.set(
        name,
        setTimeout(() => drainFeature(name), Math.max(0, at - Date.now()) + 50)
      );
    });
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, [outbox, signedIn, isOnline, drainAll, drainFeature]);

  // Returning to the foreground is worth a pass too: a retry time may have
  // lapsed while the app was in the background.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") drainAll();
    });
    return () => sub.remove();
  }, [drainAll]);
};

export default useSyncOutbox;
