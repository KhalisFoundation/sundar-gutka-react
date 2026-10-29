import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import {
  clearSyncFeature,
  enqueueSyncOp,
  mergeReminderSyncMeta,
  setReminderBanis,
  setReminderSound,
  toggleReminders,
} from "@common/actions";
import {
  applySyncResult,
  buildSyncPayload,
  diffReminders,
  parseReminders,
  sameSchedule,
  toWire,
} from "@common/reminders/syncModel";
import { logError, logMessage, logNetworkError, STRINGS, updateReminders } from "@common";
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
 * A bulk sync (`POST /reminders/sync`), run by the dashboard's own sync at
 * its moments — sign-in, foreground, connectivity returning, pull-to-refresh
 * (see syncRegistry) — and after any conflict. The device sends its whole
 * list with clocks and tombstones; the
 * server merges per reminder and returns the live set, the ids to drop, and
 * a watermark. The result is applied wholesale and the OS schedule rewritten
 * only if what it would fire actually changed.
 *
 * Applying a server answer dispatches into the very slices this hook watches,
 * so the watcher is switched off for the duration — the account's own copy
 * must not be mistaken for the user editing.
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
  const applyResult = useCallback(
    async (result) => {
      const state = store.getState();
      const items = parseReminders(state.reminderBanis);
      let baniById = new Map();
      try {
        const list = await getBaniList(state.transliterationLanguage);
        baniById = new Map(list.map((b) => [b.id, b]));
      } catch (err) {
        // Names are cosmetic: the times are what the user set. The Reminder
        // Options screen backfills names on its next visit.
        logError(err);
      }
      const applied = applySyncResult(result, {
        items,
        meta: state.remindersSync,
        baniById,
        timeForPrefix: STRINGS.time_for,
      });

      const scheduleChanged = !sameSchedule(items, applied.items);
      const enabledNow = applied.settings ? applied.settings.enabled : state.isReminders;
      const soundNow = applied.settings ? applied.settings.sound : state.reminderSound;
      const settingsChanged =
        enabledNow !== !!state.isReminders || soundNow !== state.reminderSound;

      applyingRef.current = true;
      try {
        if (scheduleChanged) dispatch(setReminderBanis(JSON.stringify(applied.items)));
        if (applied.settings) {
          if (applied.settings.enabled !== !!state.isReminders) {
            dispatch(toggleReminders(applied.settings.enabled));
          }
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
          await updateReminders(enabledNow, soundNow, JSON.stringify(applied.items));
        } catch (err) {
          logNetworkError(err, err);
        }
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
        items: parseReminders(state.reminderBanis),
        meta: state.remindersSync,
        isReminders: state.isReminders,
        reminderSound: state.reminderSound,
      });
      const res = await syncReminders(body);
      if (!res.ok) {
        logMessage(`remindersSync: bulk sync failed (${res.error ?? res.status})`);
        return false;
      }
      // Everything queued is now carried by the bulk payload.
      dispatch(clearSyncFeature(FEATURE));
      await applyResult(res.data);
      return true;
    })().finally(() => {
      reconcilingRef.current = null;
    });
    return reconcilingRef.current;
  }, [store, dispatch, applyResult]);

  // ── One outbox op ─────────────────────────────────────────────────────
  const drain = useCallback(
    async (op) => {
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
      const { base, settingsBase } = store.getState().remindersSync;
      if (op.kind === KIND_UPSERT) {
        const res = await putReminder(op.key, { ...op.payload, baseUpdatedAt: base[op.key] });
        if (res.ok && res.data?.updatedAt) {
          dispatch(
            mergeReminderSyncMeta({
              base: { [op.key]: res.data.updatedAt },
              clocks: { [op.key]: res.data.updatedAt },
            })
          );
        }
        return outcomeFor(res);
      }
      if (op.kind === KIND_DELETE) {
        const res = await deleteReminder(op.key);
        if (res.ok || res.status === 404) {
          dispatch(mergeReminderSyncMeta({ removeTombstones: [op.key], removeClocks: [op.key] }));
          return OUTCOME_DONE;
        }
        return outcomeFor(res);
      }
      if (op.kind === KIND_SETTINGS) {
        const res = await putReminderSettings({
          ...op.payload,
          baseUpdatedAt: settingsBase || undefined,
        });
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
    return store.subscribe(() => {
      const next = snapshotOf(store.getState());
      const listChanged = next.list !== previous.list;
      const settingsChanged = next.enabled !== previous.enabled || next.sound !== previous.sound;
      if (!listChanged && !settingsChanged) return;
      const before = previous;
      previous = next;
      if (applyingRef.current) return;

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
          dispatch(mergeReminderSyncMeta({ clocks, tombstones }));
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
