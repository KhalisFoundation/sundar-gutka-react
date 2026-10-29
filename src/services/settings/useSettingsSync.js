import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { clearSyncFeature, enqueueSyncOp, mergeSettingsSyncMeta } from "@common/actions";
import STRINGS from "@common/localization";
import {
  applySyncResult,
  buildSyncPayload,
  diffSettings,
  snapshotSettings,
  SYNCED_SETTINGS,
} from "@common/settings/syncModel";
import { logMessage } from "@common";
import { isTransientStatus } from "../khalisRequest";
import { putSetting, syncSettings } from "../settingsApi";
import {
  OUTCOME_CONFLICT,
  OUTCOME_DONE,
  OUTCOME_FATAL,
  OUTCOME_RETRY,
  registerSyncFeature,
} from "../sync/syncRegistry";

export const FEATURE = "settings";
const KIND_SET = "set";

// How long a burst of edits settles before it is queued. A font-size slider or
// a bani reorder fires many times a second; the outbox coalesces per key, but
// the drain runs at once, and one upload per settled edit is the right rate.
export const ENQUEUE_DEBOUNCE_MS = 1000;

/**
 * Keeps this device's settings in step with the account, and with every
 * other device signed into it.
 *
 * ── How a change leaves the phone ─────────────────────────────────────────
 * The settings are plain slices written from dozens of places, none of which
 * know about sync. So this watches the store: every change to a synced key is
 * stamped with a clock and becomes one outbox `set` op per key, carrying the
 * server clock this device last saw (`baseUpdatedAt`). The outbox sends them
 * in order and retries them; a 409 means another device changed the same
 * setting first, and the answer is a bulk sync.
 *
 * ── How the account's changes arrive ──────────────────────────────────────
 * A bulk sync (`POST /settings/sync`), run by the dashboard's own sync at its
 * moments — sign-in, foreground, connectivity returning, pull-to-refresh (see
 * syncRegistry) — and after any conflict. The device sends the settings it
 * has changed, with clocks; the server merges per key and returns the whole
 * live set. Newer values are applied with RAW dispatches — never through the
 * action creators, which would report another device's change to analytics
 * as this user's.
 *
 * Applying a server answer dispatches into the very slices this hook watches,
 * so the watcher is switched off for the duration.
 *
 * ── Signed out ────────────────────────────────────────────────────────────
 * Clocks are still recorded and ops still queued: a change made before
 * signing in is this person's, and reaches the account they sign into. The
 * outbox only drains once signed in. `settingsSync` and `syncOutbox` are
 * account data (USER_DATA_SLICES), so nothing crosses to a DIFFERENT account.
 */
const useSettingsSync = () => {
  const store = useStore();
  const dispatch = useDispatch();
  const signedIn = useSelector((state) => state.auth?.status === "signedIn");

  const applyingRef = useRef(false);
  const signedInRef = useRef(signedIn);
  signedInRef.current = signedIn;
  const reconcilingRef = useRef(null);
  const pendingRef = useRef(new Set());
  const timerRef = useRef(null);

  // ── The account → this device ─────────────────────────────────────────
  const applyResult = useCallback(
    (result) => {
      const state = store.getState();
      const applied = applySyncResult(result, {
        snapshot: snapshotSettings(state),
        meta: state.settingsSync,
      });
      applyingRef.current = true;
      try {
        applied.actions.forEach((action) => {
          dispatch(action);
          // The language creator also switches the string table; a raw
          // dispatch has to do the same or the UI keeps the old words.
          if (action.type === SYNCED_SETTINGS.language) STRINGS.setLanguage(action.value);
        });
        dispatch(mergeSettingsSyncMeta({ replace: applied.meta }));
      } finally {
        applyingRef.current = false;
      }
    },
    [store, dispatch]
  );

  // ── Bulk sync ─────────────────────────────────────────────────────────
  const reconcile = useCallback(async () => {
    if (!signedInRef.current) return false;
    if (reconcilingRef.current) return reconcilingRef.current;
    reconcilingRef.current = (async () => {
      const state = store.getState();
      const body = buildSyncPayload({
        snapshot: snapshotSettings(state),
        meta: state.settingsSync,
      });
      const res = await syncSettings(body);
      if (!res.ok) {
        logMessage(`settingsSync: bulk sync failed (${res.error ?? res.status})`);
        return false;
      }
      // Everything queued is now carried by the bulk payload.
      dispatch(clearSyncFeature(FEATURE));
      applyResult(res.data);
      return true;
    })().finally(() => {
      reconcilingRef.current = null;
    });
    return reconcilingRef.current;
  }, [store, dispatch, applyResult]);

  // ── One outbox op ─────────────────────────────────────────────────────
  const drain = useCallback(
    async (op) => {
      if (op.kind !== KIND_SET || !SYNCED_SETTINGS[op.key]) return OUTCOME_FATAL;
      // Built at send time, not enqueue time: the freshest value is what
      // should go up, and the base is read NOW because an op sent just before
      // this one may have moved the server clock for another key.
      const state = store.getState();
      const value = state[op.key];
      if (value === undefined) return OUTCOME_DONE;
      const res = await putSetting(op.key, {
        value,
        baseUpdatedAt: state.settingsSync.base[op.key] || undefined,
      });
      if (res.ok) {
        const updatedAt = res.data?.updatedAt;
        dispatch(
          mergeSettingsSyncMeta({
            base: updatedAt ? { [op.key]: updatedAt } : {},
            removeClocks: [op.key],
          })
        );
        return OUTCOME_DONE;
      }
      if (res.status === 409 || res.status === 404) return OUTCOME_CONFLICT;
      if (res.status === 401 || isTransientStatus(res.status)) return OUTCOME_RETRY;
      return OUTCOME_FATAL;
    },
    [store, dispatch]
  );

  useEffect(() => registerSyncFeature(FEATURE, { drain, reconcile }), [drain, reconcile]);

  // ── This device → the outbox ──────────────────────────────────────────
  useEffect(() => {
    const flush = () => {
      timerRef.current = null;
      const keys = [...pendingRef.current];
      pendingRef.current.clear();
      if (!keys.length) return;
      const now = Date.now();
      const clocks = {};
      keys.forEach((key) => {
        clocks[key] = now;
      });
      dispatch(mergeSettingsSyncMeta({ clocks }));
      keys.forEach((key) => {
        dispatch(enqueueSyncOp({ feature: FEATURE, kind: KIND_SET, key, payload: {} }));
      });
    };

    let previous = snapshotSettings(store.getState());
    const unsubscribe = store.subscribe(() => {
      const next = snapshotSettings(store.getState());
      const changed = diffSettings(previous, next);
      if (!changed.length) return;
      previous = next;
      // The account's own copy arriving is not the user editing.
      if (applyingRef.current) return;
      changed.forEach((key) => pendingRef.current.add(key));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, ENQUEUE_DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [store, dispatch]);
};

export default useSettingsSync;
