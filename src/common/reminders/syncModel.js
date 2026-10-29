import { to12h, to24h } from "./time";

// Reminders across devices — the pure half.
//
// The list the app edits (`reminderBanis`, a JSON string of items keyed by
// baani id) is written from eight places and knows nothing about sync. This
// module turns "the list changed" into the operations the server understands,
// builds the bulk-sync payload, and folds a server answer back into a list —
// all without React, Redux or the network, so every rule has a unit test.
//
// Clocks live beside the list in the `remindersSync` slice:
//   clocks      { [baniId]: ms }  when this device last changed the reminder
//   tombstones  { [baniId]: ms }  reminders this device deleted, not yet
//                                 confirmed by a sync
//   base        { [baniId]: ms }  the server clock last seen per reminder —
//                                 sent as `baseUpdatedAt` so a write over a
//                                 version this device has not seen is refused
//   settingsUpdatedAt / settingsBase — the same pair for the on/off + sound
//   lastSyncedAt  the server watermark from the last sync

export const emptyRemindersSync = () => ({
  clocks: {},
  tombstones: {},
  base: {},
  settingsUpdatedAt: 0,
  settingsBase: 0,
  lastSyncedAt: 0,
});

export const parseReminders = (json) => {
  try {
    const parsed = JSON.parse(json || "[]");
    return Array.isArray(parsed) ? parsed.filter((it) => it && it.key != null) : [];
  } catch (_) {
    return [];
  }
};

const keyOf = (item) => Number(item.key);

/** The part of a reminder the account stores. */
export const toWire = (item) => ({
  time: to24h(item.time),
  enabled: !!item.enabled,
  title: item.titleCustom && item.title ? String(item.title) : null,
});

const sameWire = (a, b) =>
  a.time === b.time && a.enabled === b.enabled && (a.title ?? null) === (b.title ?? null);

/**
 * What changed between two lists, as server operations.
 * @returns {{ upserts: object[], deletes: number[] }}
 */
export const diffReminders = (prevItems, nextItems) => {
  const prev = new Map(prevItems.map((it) => [keyOf(it), it]));
  const next = new Map(nextItems.map((it) => [keyOf(it), it]));
  const upserts = [];
  const deletes = [];
  next.forEach((item, key) => {
    const before = prev.get(key);
    if (!before || !sameWire(toWire(before), toWire(item))) upserts.push(item);
  });
  prev.forEach((_, key) => {
    if (!next.has(key)) deletes.push(key);
  });
  return { upserts, deletes };
};

/**
 * The bulk-sync body: every local reminder with the clock it was last changed
 * at, every unconfirmed deletion, and the settings only if this device has
 * changed them — an untouched device must never overwrite another's choice.
 */
export const buildSyncPayload = ({ items, meta, isReminders, reminderSound, now = Date.now() }) => {
  const reminders = items.map((item) => ({
    baniId: keyOf(item),
    ...toWire(item),
    updatedAt: meta.clocks[keyOf(item)] ?? 0,
  }));
  Object.entries(meta.tombstones).forEach(([baniId, deletedAt]) => {
    reminders.push({
      baniId: Number(baniId),
      time: "00:00",
      enabled: false,
      title: null,
      updatedAt: meta.clocks[baniId] ?? deletedAt,
      deletedAt,
    });
  });
  const body = { reminders, lastSyncedAt: meta.lastSyncedAt || 0 };
  if (meta.settingsUpdatedAt) {
    body.settings = {
      enabled: !!isReminders,
      sound: reminderSound || "default",
      updatedAt: Math.min(meta.settingsUpdatedAt, now),
    };
  }
  return body;
};

/**
 * A server row as an app list item. Names come from the local bani database
 * (they are not stored on the account); an existing local item lends its
 * names and custom title so nothing the user typed is lost in the round trip.
 */
export const itemFromRow = (row, { existing = null, bani = null, timeForPrefix = "" } = {}) => {
  const translit = existing?.translit || bani?.translit || "";
  const gurmukhi = existing?.gurmukhi || bani?.gurmukhi || "";
  const customTitle = row.title ? String(row.title) : null;
  return {
    key: row.baniId,
    id: row.baniId,
    gurmukhi,
    translit,
    enabled: !!row.enabled,
    time: to12h(row.time),
    title:
      customTitle || (translit ? `${timeForPrefix} ${translit}`.trim() : existing?.title || ""),
    titleCustom: !!customTitle,
  };
};

/**
 * Fold a sync answer into local state. Returns the new list, the settings to
 * apply (or null when the account has none), and the clocks to record.
 */
export const applySyncResult = (
  result,
  { items, meta, baniById = new Map(), timeForPrefix = "" }
) => {
  const existingByKey = new Map(items.map((it) => [keyOf(it), it]));
  const deleted = new Set(result.deletedBaniIds ?? []);
  const nextItems = (result.reminders ?? []).map((row) =>
    itemFromRow(row, {
      existing: existingByKey.get(row.baniId) ?? null,
      bani: baniById.get(row.baniId) ?? null,
      timeForPrefix,
    })
  );
  // Clocks reset to the server's: after a sync the server copy IS this
  // device's copy, so every local change starts from that version.
  const base = {};
  const clocks = {};
  (result.reminders ?? []).forEach((row) => {
    base[row.baniId] = row.updatedAt;
    clocks[row.baniId] = row.updatedAt;
  });
  const tombstones = { ...meta.tombstones };
  deleted.forEach((id) => delete tombstones[id]);
  // Anything the server no longer lists is gone: a tombstone this device
  // sent has been honoured, or another device's deletion won.
  Object.keys(tombstones).forEach((id) => {
    if (!base[id]) delete tombstones[id];
  });
  const settings = result.settings
    ? { enabled: !!result.settings.enabled, sound: result.settings.sound }
    : null;
  return {
    items: nextItems,
    settings,
    meta: {
      clocks,
      tombstones,
      base,
      settingsUpdatedAt: 0,
      settingsBase: result.settings?.updatedAt ?? meta.settingsBase ?? 0,
      lastSyncedAt: result.syncedAt ?? meta.lastSyncedAt ?? 0,
    },
  };
};

/** True when two lists would schedule the same notifications. */
export const sameSchedule = (a, b) => {
  if (a.length !== b.length) return false;
  const byKey = new Map(b.map((it) => [keyOf(it), it]));
  return a.every((it) => {
    const other = byKey.get(keyOf(it));
    return (
      other &&
      other.time === it.time &&
      !!other.enabled === !!it.enabled &&
      (other.title || "") === (it.title || "")
    );
  });
};
