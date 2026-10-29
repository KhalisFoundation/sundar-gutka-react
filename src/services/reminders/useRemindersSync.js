import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import {
  enqueueSyncOp,
  mergeReminderSyncMeta,
  setReminderBanis,
  setReminderSound,
  syncOpDone,
  toggleReminders,
} from "@common/actions";
import { cancelReminderTriggers, rearmReminders } from "@common/notifications";
import {
  applySyncResult,
  buildSyncPayload,
  diffReminders,
  parseReminders,
  sameSchedule,
  toWire,
} from "@common/reminders/syncModel";
import { isAppWrite } from "@common/settings/appWrite";
import {
  canScheduleExactAlarms,
  hasNotificationPermission,
  logError,
  logMessage,
  logNetworkError,
  STRINGS,
} from "@common";
import { getBaniList } from "@database";
import { isTransientStatus } from "../khalisRequest";
import { deleteReminder, putReminder, putReminderSettings, syncReminders } from "../remindersApi";
import {
  OUTCOME_CONFLICT,
  OUTCOME_DONE,
  OUTCOME_FATAL,
  OUTCOME_RETRY,
  registerSyncFeature,
} from "../sync/syncRegistry";

export const FEATURE = "reminders";

// Who a request was made for: the person, and which side of the last account
// boundary (CLEAR_USER_DATA) — so a sign-out's purge counts as a change even
// before the session itself has ended. null when signed out.
const accountOf = (state) =>
  state.auth?.status === "signedIn"
    ? `${state.accountEpoch ?? 0}:${state.auth.user?.email ?? ""}`
    : null;

// The three slices a person edits. Compared by reference: each write replaces
// its value, so "nothing changed" is three identity checks.
const sameEdits = (a, b) =>
  a.reminderBanis === b.reminderBanis &&
  a.isReminders === b.isReminders &&
  a.reminderSound === b.reminderSound;

const KIND_UPSERT = "upsert";
const KIND_DELETE = "delete";
const KIND_SETTINGS = "settings";

/**
 * Keeps this device's reminders in step with the account, and with every
 * other device signed into it.
 *
 * ── How a change leaves the phone ─────────────────────────────────────────
 * The reminder list is written from eight places, none of which know about
 * sync. So this watches the store: every change to the list or the switches
 * is diffed against the previous value and becomes outbox operations —
 * `upsert` and `delete` per reminder, `settings` for the switches — each
 * carrying the server clock this device last saw (`baseUpdatedAt`). The
 * outbox sends them in order and retries them; a 409 means another device
 * changed the same reminder first, and the answer is a bulk sync.
 *
 * ── How the account's changes arrive ──────────────────────────────────────
 * A bulk sync (`POST /reminders/sync`), run at the account-sync moments —
 * sign-in, foreground, connectivity returning (see useAccountSync), and a
 * pull-to-refresh on the Dashboard or the Pothis tab — and after
 * any conflict, including the first change made for an account this device has
 * never synced with. The device sends its whole
 * list with clocks and tombstones; the
 * server merges per reminder and returns the live set, the ids to drop, and
 * a watermark. The result is applied wholesale and the OS schedule rewritten
 * only if what it would fire actually changed.
 *
 * Applying a server answer dispatches into the very slices this hook watches,
 * so the watcher is switched off for the duration — the account's own copy
 * must not be mistaken for the user editing. Nor is the app's own write (see
 * appWrite): defaults filling an empty list, or reminders switched off because
 * this phone lost a permission.
 *
 * ── Signed out, and the account boundary ──────────────────────────────────
 * Changes are still clocked and queued signed out — they are this person's,
 * and reach the account they sign into. The reminders are account data
 * (USER_DATA_SLICES), so a purge clears them; the watcher takes that as a new
 * starting point, not as the person deleting every reminder, and an answer
 * that lands after the boundary moved is dropped.
 */
const useRemindersSync = () => {
  const store = useStore();
  const dispatch = useDispatch();
  const signedIn = useSelector((state) => state.auth?.status === "signedIn");

  const applyingRef = useRef(false);
  const signedInRef = useRef(signedIn);
  signedInRef.current = signedIn;
  const reconcilingRef = useRef(null);

  // ── The account → this device ─────────────────────────────────────────
  // `built`: the state the request was built from. An edit made since is newer
  // than the answer, and is queued to go up on its own; laying the answer over
  // it would undo it here. It is left for the next sync to settle.
  const applyResult = useCallback(
    async (result, { account, built }) => {
      let baniById = new Map();
      try {
        const list = await getBaniList(store.getState().transliterationLanguage);
        baniById = new Map(list.map((b) => [b.id, b]));
      } catch (err) {
        // Names are cosmetic: the times are what the user set. The Reminder
        // Options screen backfills names on its next visit.
        logError(err);
      }
      // Whether THIS phone can deliver a reminder. The account says on/off for
      // the person, but switched on here without the permissions, the switch
      // read ON with nothing able to fire — and Settings' check then switched
      // it off (unsynced), so every sync and every visit flipped it back.
      const canDeliver = result?.settings?.enabled
        ? (await hasNotificationPermission().catch(() => false)) &&
          (await canScheduleExactAlarms().catch(() => false))
        : true;
      const state = store.getState();
      if (accountOf(state) !== account) return;
      if (!sameEdits(state, built)) {
        logMessage("remindersSync: edited while syncing; the answer waits for the next sync");
        return;
      }
      const items = parseReminders(state.reminderBanis);
      const applied = applySyncResult(result, {
        items,
        meta: state.remindersSync,
        baniById,
        timeForPrefix: STRINGS.time_for,
      });

      const scheduleChanged = !sameSchedule(items, applied.items);
      const enabledNow = applied.settings
        ? applied.settings.enabled && (!!state.isReminders || canDeliver)
        : state.isReminders;
      // A settings row without a sound keeps this device's: the store only takes
      // a sound that is there, and the schedule must play the one it holds.
      const soundNow = applied.settings?.sound || state.reminderSound;
      const settingsChanged =
        enabledNow !== !!state.isReminders || soundNow !== state.reminderSound;

      applyingRef.current = true;
      try {
        if (scheduleChanged) dispatch(setReminderBanis(JSON.stringify(applied.items)));
        if (applied.settings) {
          if (enabledNow !== !!state.isReminders) dispatch(toggleReminders(enabledNow));
          if (applied.settings.sound && applied.settings.sound !== state.reminderSound) {
            dispatch(setReminderSound(applied.settings.sound));
          }
        }
        dispatch(mergeReminderSyncMeta({ replace: applied.meta }));
      } finally {
        applyingRef.current = false;
      }

      if (scheduleChanged || settingsChanged) {
        try {
          // The schedule only. Not updateReminders, which also clears the
          // shade: a change made on another phone would throw away a reminder
          // sitting unread here. In the script the person reads — a stock
          // title is resolved when it is scheduled.
          if (enabledNow) {
            await rearmReminders(
              soundNow,
              JSON.stringify(applied.items),
              !!store.getState().isTransliteration
            );
          } else {
            await cancelReminderTriggers();
          }
        } catch (err) {
          logNetworkError(err, err);
        }
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
        const state = store.getState();
        const account = accountOf(state);
        const body = buildSyncPayload({
          items: parseReminders(state.reminderBanis),
          meta: state.remindersSync,
          isReminders: state.isReminders,
          reminderSound: state.reminderSound,
        });
        // The ops this payload carries, as they were. Only these are finished
        // with when it lands; one queued (or merged into a waiting op) while it
        // was out holds a change it never saw, so ops match by identity.
        const carried = Object.values(state.syncOutbox.ops).filter((op) => op.feature === FEATURE);
        const res = await syncReminders(body);
        // Purged or signed out while it was out: the answer is another
        // account's, or no one's.
        if (accountOf(store.getState()) !== account) return false;
        if (!res.ok) {
          logMessage(`remindersSync: bulk sync failed (${res.error ?? res.status})`);
          return false;
        }
        const { ops } = store.getState().syncOutbox;
        carried.forEach((op) => {
          if (ops[op.id] === op) dispatch(syncOpDone(op.id));
        });
        await applyResult(res.data, { account, built: state });
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
      const state = store.getState();
      // Never synced with this account: no server clock is known, so a write
      // would carry no base and overwrite another device's newer reminder
      // unchecked. The first sync is the bulk one, which merges per reminder.
      if (!state.remindersSync.lastSyncedAt) return OUTCOME_CONFLICT;
      const account = accountOf(state);
      const epoch = state.accountEpoch ?? 0;
      // After the request. Purged while it was out: the account it was for is
      // gone, and so is the op. Only the session ended (an expiry, a refused
      // token): it still belongs to this account, and goes when it is back. A
      // fault in the request itself, not the network: retrying cannot help.
      const settle = (res) => {
        const after = store.getState();
        if ((after.accountEpoch ?? 0) !== epoch) return OUTCOME_DONE;
        if (accountOf(after) !== account) return OUTCOME_RETRY;
        if (res.status === 0 && res.error === "failed") return OUTCOME_FATAL;
        return null;
      };
      const outcomeFor = (res) => {
        if (res.ok) return OUTCOME_DONE;
        if (res.status === 409 || res.status === 404) return OUTCOME_CONFLICT;
        if (res.status === 401 || isTransientStatus(res.status)) return OUTCOME_RETRY;
        return OUTCOME_FATAL;
      };
      // The base clock is read NOW, not when the op was queued: an op sent
      // just before this one may have moved the server's clock, and a base
      // captured earlier would be refused as stale for a change that is
      // actually the latest.
      const { base, settingsBase, clocks } = state.remindersSync;
      // A newer edit to the same reminder while this was out keeps its own
      // clock; it is queued behind this op and still needs it.
      const unchanged = (key) => store.getState().remindersSync.clocks[key] === clocks[key];
      if (op.kind === KIND_UPSERT) {
        const res = await putReminder(op.key, { ...op.payload, baseUpdatedAt: base[op.key] });
        const settled = settle(res);
        if (settled) return settled;
        if (res.ok && res.data?.updatedAt) {
          dispatch(
            mergeReminderSyncMeta({
              base: { [op.key]: res.data.updatedAt },
              clocks: unchanged(op.key) ? { [op.key]: res.data.updatedAt } : {},
            })
          );
        }
        return outcomeFor(res);
      }
      if (op.kind === KIND_DELETE) {
        const res = await deleteReminder(op.key);
        const settled = settle(res);
        if (settled) return settled;
        if (res.ok || res.status === 404) {
          dispatch(
            mergeReminderSyncMeta({
              removeTombstones: [op.key],
              removeClocks: unchanged(op.key) ? [op.key] : [],
            })
          );
          return OUTCOME_DONE;
        }
        return outcomeFor(res);
      }
      if (op.kind === KIND_SETTINGS) {
        const res = await putReminderSettings({
          ...op.payload,
          baseUpdatedAt: settingsBase || undefined,
        });
        const settled = settle(res);
        if (settled) return settled;
        if (res.ok && res.data?.updatedAt) {
          dispatch(mergeReminderSyncMeta({ settingsBase: res.data.updatedAt }));
        }
        return outcomeFor(res);
      }
      return OUTCOME_FATAL;
    },
    [store, dispatch]
  );

  useEffect(() => registerSyncFeature(FEATURE, { drain, reconcile }), [drain, reconcile]);

  // ── This device → the outbox ──────────────────────────────────────────
  useEffect(() => {
    const snapshotOf = (s) => ({
      list: s.reminderBanis,
      enabled: s.isReminders,
      sound: s.reminderSound,
    });
    let previous = snapshotOf(store.getState());
    let epoch = store.getState().accountEpoch;
    return store.subscribe(() => {
      // An account boundary. The purge empties the list, which is not the
      // person deleting every reminder: queued, those deletes went to the
      // account still signed in while the sign-out finished, and took its
      // reminders off every device. A fresh starting point instead.
      if (store.getState().accountEpoch !== epoch) {
        epoch = store.getState().accountEpoch;
        previous = snapshotOf(store.getState());
        return;
      }
      const next = snapshotOf(store.getState());
      const listChanged = next.list !== previous.list;
      const settingsChanged = next.enabled !== previous.enabled || next.sound !== previous.sound;
      if (!listChanged && !settingsChanged) return;
      const before = previous;
      previous = next;
      if (applyingRef.current || isAppWrite()) return;

      const now = Date.now();
      if (listChanged) {
        const { upserts, deletes } = diffReminders(
          parseReminders(before.list),
          parseReminders(next.list)
        );
        if (upserts.length || deletes.length) {
          const clocks = {};
          const tombstones = {};
          upserts.forEach((item) => {
            clocks[item.key] = now;
          });
          deletes.forEach((key) => {
            tombstones[key] = now;
            clocks[key] = now;
          });
          // A reminder added back is no longer deleted. Its queued delete is
          // replaced by the upsert (same key), so nothing else would clear the
          // tombstone, and every bulk sync would send it live AND deleted.
          dispatch(
            mergeReminderSyncMeta({
              clocks,
              tombstones,
              removeTombstones: upserts.map((item) => item.key),
            })
          );
          upserts.forEach((item) => {
            dispatch(
              enqueueSyncOp({
                feature: FEATURE,
                kind: KIND_UPSERT,
                key: Number(item.key),
                payload: toWire(item),
              })
            );
          });
          deletes.forEach((key) => {
            dispatch(enqueueSyncOp({ feature: FEATURE, kind: KIND_DELETE, key }));
          });
        }
      }
      if (settingsChanged) {
        dispatch(mergeReminderSyncMeta({ settingsUpdatedAt: now }));
        dispatch(
          enqueueSyncOp({
            feature: FEATURE,
            kind: KIND_SETTINGS,
            key: "settings",
            payload: { enabled: !!next.enabled, sound: next.sound || "default" },
          })
        );
      }
    });
  }, [store, dispatch]);
};

export default useRemindersSync;
