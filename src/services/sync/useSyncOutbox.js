import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useDispatch, useSelector, useStore } from "react-redux";
import { syncOpDone, syncOpFailed, syncOpSending } from "@common/actions";
import { nextAttemptAt, nextRunnable, pendingCount } from "@common/sync/outboxModel";
import { logError, logMessage, logNetworkError, useNetwork } from "@common";
import {
  getSyncFeature,
  OUTCOME_CONFLICT,
  OUTCOME_DONE,
  OUTCOME_RETRY,
  syncFeatureNames,
  syncRegistryVersion,
} from "./syncRegistry";

// Drains the outbox.
//
// Every change to account data lands in the persisted `syncOutbox` slice
// first (see common/sync/outboxModel) and this hook sends it: one operation
// at a time per feature, in the order it was made, retrying with backoff when
// the network is away. On a conflict — the server refused because another
// device changed the same thing first — the feature's queue is handed to its
// bulk reconcile, which pushes the current local state and takes back the
// merged result, and marks done the ops it carried. Until it succeeds they
// stay queued: a reconcile that fails leaves the conflicting op to be retried
// with backoff, so nothing is lost to a server blip or a killed app.
//
// Mounted once, in GlobalServices, so a change made on any screen goes up
// whether or not that screen is still open.
const useSyncOutbox = () => {
  const store = useStore();
  const dispatch = useDispatch();
  // Each feature's op count and soonest retry, not the whole outbox: every
  // send replaces the outbox object, and each one would otherwise re-run the
  // drain pass and re-arm every timer. This changes when an op is added,
  // finished or rescheduled, which are the moments a pass is owed.
  //
  // Cached by outbox reference: this runs on every dispatch in the app, and
  // nearly none of them touch the outbox.
  const keyCacheRef = useRef({ outbox: null, version: -1, key: "" });
  const retryKey = useSelector((state) => {
    const cache = keyCacheRef.current;
    const version = syncRegistryVersion();
    if (state.syncOutbox === cache.outbox && version === cache.version) return cache.key;
    const key = syncFeatureNames()
      .map(
        (name) =>
          `${name}:${pendingCount(state.syncOutbox, name)}:${
            nextAttemptAt(state.syncOutbox, name) ?? "-"
          }`
      )
      .join("|");
    keyCacheRef.current = { outbox: state.syncOutbox, version, key };
    return key;
  });
  const signedIn = useSelector((state) => state.auth?.status === "signedIn");
  const { isOnline } = useNetwork();
  // One drain per feature at a time; a second trigger while one is running
  // simply asks for another pass when it finishes.
  const runningRef = useRef(new Set());
  const rerunRef = useRef(new Set());
  const timersRef = useRef(new Map());
  const signedInRef = useRef(signedIn);
  signedInRef.current = signedIn;
  // Read by every pass, whatever started it: a foreground while offline would
  // otherwise fire requests that can only fail, each one pushing the op's
  // retry further out, so it then waited minutes after the network came back.
  const onlineRef = useRef(isOnline);
  onlineRef.current = isOnline;

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
          if (!signedInRef.current || !onlineRef.current) return;
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
            // The bulk sync carries every pending change up in one go, and
            // marks done the ops it carried. If it does not get through, this
            // op is retried later rather than dropped.
            // eslint-disable-next-line no-await-in-loop
            const ok = await impl.reconcile?.();
            if (!ok) logMessage(`sync: ${name} reconcile after conflict did not complete`);
            // Still here means the reconcile did not carry it: it failed, or
            // this joined one already running that was built before the op
            // existed. Back to the queue, or it would sit "sending" and hold
            // up every later op of the feature.
            if (store.getState().syncOutbox.ops[op.id]) {
              dispatch(syncOpFailed(op.id, "conflict"));
            }
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
    const { syncOutbox } = store.getState();
    syncFeatureNames().forEach((name) => {
      const at = nextAttemptAt(syncOutbox, name);
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
  }, [retryKey, signedIn, isOnline, drainAll, drainFeature, store]);

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
