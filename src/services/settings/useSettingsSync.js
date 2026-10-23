import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { mergeThemeRegistry } from "@theme/reader/registry";
import { enqueueSyncOp, mergeSettingsSyncMeta, syncOpDone } from "@common/actions";
import { MARK_READER_THEME_SEEDED } from "@common/actions/actionTypes";
import STRINGS from "@common/localization";
import { isAppWrite } from "@common/settings/appWrite";
import {
  applySyncResult,
  buildSyncPayload,
  diffSettings,
  snapshotSettings,
  SYNCED_SETTINGS,
  SYNCED_SETTING_KEYS,
} from "@common/settings/syncModel";
import { constant, logMessage } from "@common";
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

// Who a request was made for: the person, and which side of the last account
// boundary (CLEAR_USER_DATA) — so a sign-out's purge counts as a change even
// before the session itself has ended. null when signed out.
const accountOf = (state) =>
  state.auth?.status === "signedIn"
    ? `${state.accountEpoch ?? 0}:${state.auth.user?.email ?? ""}`
    : null;
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
 * A bulk sync (`POST /settings/sync`), run at the account-sync moments —
 * sign-in, foreground, connectivity returning (see useAccountSync) — and after
 * any conflict. The device sends the settings it
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
  // Stamps and queues the edits still settling in the debounce window. Set by
  // the watcher below; a reconcile calls it first, so an edit made a moment
  // before the account's copy arrives is sent with its clock rather than
  // overwritten by the server value.
  const flushRef = useRef(() => {});

  // ── The account → this device ─────────────────────────────────────────
  const applyResult = useCallback(
    (result) => {
      // An edit made while the request was out is still settling, with no
      // clock yet; stamped now it is newer than the answer and is kept (and
      // sent), rather than overwritten by the value it replaced.
      flushRef.current();
      const state = store.getState();
      const applied = applySyncResult(result, {
        snapshot: snapshotSettings(state),
        meta: state.settingsSync,
      });
      // A theme this device cannot resolve — a backend theme not fetched yet,
      // or one this build does not know — is not applied: the device keeps
      // its own until it can show the account's.
      // The appearance choices (Default, Light, Dark) are always known.
      const known = mergeThemeRegistry(state.remoteThemes).byId;
      const appearances = [constant.Default, constant.Light, constant.Dark];
      const actions = applied.actions.filter(
        (action) =>
          action.type !== SYNCED_SETTINGS.theme ||
          appearances.includes(action.value) ||
          known[action.value]
      );
      applyingRef.current = true;
      try {
        actions.forEach((action) => {
          dispatch(action);
          // The language creator also switches the string table; a raw
          // dispatch has to do the same or the UI keeps the old words.
          if (action.type === SYNCED_SETTINGS.language) STRINGS.setLanguage(action.value);
          // A theme that arrives from the account arrives with the person's
          // own display toggles. Marked as seeded, so choosing it here later
          // does not lay the theme's suggested toggles over them (applyTheme).
          if (action.type === SYNCED_SETTINGS.theme) {
            dispatch({ type: MARK_READER_THEME_SEEDED, value: action.value });
          }
        });
        dispatch(mergeSettingsSyncMeta({ replace: applied.meta }));
      } finally {
        applyingRef.current = false;
      }
    },
    [store, dispatch]
  );

  // ── Bulk sync ─────────────────────────────────────────────────────────
  // `fresh`: a run already out was built before the latest edits, so wait for
  // it and run again rather than join it (sign-out's last push, which drops
  // the outbox afterwards).
  const reconcile = useCallback(
    async ({ fresh = false } = {}) => {
      if (!signedInRef.current) return false;
      if (reconcilingRef.current) {
        if (!fresh) return reconcilingRef.current;
        await reconcilingRef.current.catch(() => false);
        if (reconcilingRef.current) return reconcilingRef.current;
      }
      reconcilingRef.current = (async () => {
        flushRef.current();
        const state = store.getState();
        const account = accountOf(state);
        const body = buildSyncPayload({
          snapshot: snapshotSettings(state),
          meta: state.settingsSync,
        });
        // The ops this payload carries, as they were. Only these are finished
        // with when it lands: an edit queued while the request was out is one
        // the payload never saw, and must still go up — including one merged
        // into an op already waiting, which keeps that op's id but not its
        // object, so ops are matched by identity rather than by id.
        const carried = Object.values(state.syncOutbox.ops).filter((op) => op.feature === FEATURE);
        const res = await syncSettings(body);
        // The account boundary moved while it was out: a sign-out stops waiting
        // for its flush after a few seconds and purges, so this answer belongs
        // to an account that is gone, and writing it would hand that account's
        // watermark and bases to the next one.
        if (accountOf(store.getState()) !== account) return false;
        if (!res.ok) {
          logMessage(`settingsSync: bulk sync failed (${res.error ?? res.status})`);
          return false;
        }
        const { ops } = store.getState().syncOutbox;
        carried.forEach((op) => {
          if (ops[op.id] === op) dispatch(syncOpDone(op.id));
        });
        applyResult(res.data);
        return true;
      })().finally(() => {
        reconcilingRef.current = null;
      });
      return reconcilingRef.current;
    },
    [store, dispatch, applyResult]
  );

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
      // Never synced with this account yet: no server clock is known for any
      // key, so a PUT would carry no base and overwrite another device's newer
      // value unchecked. The first sync is the bulk one, which merges per key.
      if (!state.settingsSync.lastSyncedAt) return OUTCOME_CONFLICT;
      const sentClock = state.settingsSync.clocks[op.key];
      const account = accountOf(state);
      const res = await putSetting(op.key, {
        value,
        baseUpdatedAt: state.settingsSync.base[op.key] || undefined,
      });
      const after = store.getState();
      // As in reconcile: purged while it was out, so the account this was for
      // is gone, and so is the op.
      if ((after.accountEpoch ?? 0) !== (state.accountEpoch ?? 0)) return OUTCOME_DONE;
      // Only the session ended (an expiry, a refused token): the op still
      // belongs to this account and goes up when it signs back in. Reported
      // done, it was dropped from the outbox.
      if (accountOf(after) !== account) return OUTCOME_RETRY;
      // A fault in the request itself, not the network: retrying cannot
      // help, and the op would hold up every later one of this feature.
      if (res.status === 0 && res.error === "failed") return OUTCOME_FATAL;
      if (res.ok) {
        const updatedAt = res.data?.updatedAt;
        // The clock goes only if no newer edit replaced it while this PUT was
        // in flight; that edit is queued behind this op and still needs it.
        const unchanged = store.getState().settingsSync.clocks[op.key] === sentClock;
        dispatch(
          mergeSettingsSyncMeta({
            base: updatedAt ? { [op.key]: updatedAt } : {},
            removeClocks: unchanged ? [op.key] : [],
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
      if (timerRef.current) clearTimeout(timerRef.current);
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

    flushRef.current = flush;

    let previous = snapshotSettings(store.getState());
    let epoch = store.getState().accountEpoch;
    const unsubscribe = store.subscribe(() => {
      // An account boundary: edits still settling belong to the account that
      // just left. Stamped after it, they would go up to the next one.
      if (store.getState().accountEpoch !== epoch) {
        epoch = store.getState().accountEpoch;
        pendingRef.current.clear();
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        previous = snapshotSettings(store.getState());
        return;
      }
      const next = snapshotSettings(store.getState());
      // Most dispatches touch no setting at all (scroll ticks, playback and
      // download progress), and redux keeps an untouched slice's reference,
      // so the deep compare only runs when one actually changed.
      if (SYNCED_SETTING_KEYS.every((key) => next[key] === previous[key])) return;
      // A setting going from nothing to a value is the app filling a default
      // (HomeScreen seeds the bani order and the language on a fresh install),
      // not the person choosing. Stamped as an edit it was newer than the
      // account's own copy, and the default overwrote the order saved on the
      // person's other device the moment they signed in.
      const changed = diffSettings(previous, next).filter((key) => previous[key] != null);
      previous = next;
      if (!changed.length) return;
      // The account's own copy arriving is not the user editing, and nor is
      // the app normalising a value (see appWrite).
      if (applyingRef.current || isAppWrite()) return;
      changed.forEach((key) => pendingRef.current.add(key));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, ENQUEUE_DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      flushRef.current = () => {};
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [store, dispatch]);
};

export default useSettingsSync;
