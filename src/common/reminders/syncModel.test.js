/* eslint-env jest */
import {
  applySyncResult,
  buildSyncPayload,
  diffReminders,
  emptyRemindersSync,
  itemFromRow,
  parseReminders,
  sameSchedule,
  toWire,
} from "./syncModel";
import { to12h, to24h } from "./time";

const item = (over = {}) => ({
  key: 2,
  id: 2,
  gurmukhi: "jpujI swihb",
  translit: "Japji Sahib",
  enabled: true,
  time: "5:30 AM",
  title: "Time for Japji Sahib",
  ...over,
});

describe("time", () => {
  it("round-trips 12h and 24h", () => {
    expect(to24h("5:30 AM")).toBe("05:30");
    expect(to24h("6:05 PM")).toBe("18:05");
    expect(to24h("12:00 AM")).toBe("00:00");
    expect(to24h("12:15 PM")).toBe("12:15");
    expect(to12h("18:05")).toBe("6:05 PM");
    expect(to12h("00:00")).toBe("12:00 AM");
    expect(to12h("5:30 AM")).toBe("5:30 AM");
  });
});

describe("parse / wire", () => {
  it("tolerates a broken list and sends only what the account stores", () => {
    expect(parseReminders("nope")).toEqual([]);
    expect(parseReminders(JSON.stringify([item(), { noKey: true }]))).toHaveLength(1);
    expect(toWire(item())).toEqual({ time: "05:30", enabled: true, title: null });
    expect(toWire(item({ title: "Wake up", titleCustom: true })).title).toBe("Wake up");
  });
});

describe("diffReminders", () => {
  it("finds adds, edits, and removals by baani", () => {
    const prev = [item(), item({ key: 4, id: 4, translit: "Jaap Sahib" })];
    const next = [item({ time: "5:45 AM" }), item({ key: 21, id: 21, translit: "Rehras" })];
    const { upserts, deletes } = diffReminders(prev, next);
    expect(upserts.map((u) => u.key)).toEqual([2, 21]);
    expect(deletes).toEqual([4]);
  });

  it("ignores changes to fields the account does not store", () => {
    const prev = [item()];
    const next = [item({ gurmukhi: "different rendering" })];
    expect(diffReminders(prev, next)).toEqual({ upserts: [], deletes: [] });
  });
});

describe("buildSyncPayload", () => {
  it("carries every reminder with its clock, unconfirmed deletions, and settings only when changed", () => {
    const meta = {
      ...emptyRemindersSync(),
      clocks: { 2: 1000 },
      tombstones: { 4: 2000 },
      lastSyncedAt: 500,
    };
    const body = buildSyncPayload({ items: [item()], meta, isReminders: true, reminderSound: "x" });
    expect(body.reminders).toEqual([
      { baniId: 2, time: "05:30", enabled: true, title: null, updatedAt: 1000 },
      { baniId: 4, time: "00:00", enabled: false, title: null, updatedAt: 2000, deletedAt: 2000 },
    ]);
    expect(body.lastSyncedAt).toBe(500);
    expect(body.settings).toBeUndefined();

    const withSettings = buildSyncPayload({
      items: [],
      meta: { ...meta, settingsUpdatedAt: 3000 },
      isReminders: false,
      reminderSound: "waheguru",
      now: 5000,
    });
    expect(withSettings.settings).toEqual({ enabled: false, sound: "waheguru", updatedAt: 3000 });
  });
});

describe("applySyncResult", () => {
  const meta = { ...emptyRemindersSync(), tombstones: { 4: 2000, 9: 2500 }, clocks: { 2: 1 } };
  const result = {
    reminders: [
      { baniId: 2, time: "05:45", enabled: true, title: null, updatedAt: 9000 },
      { baniId: 21, time: "18:30", enabled: false, title: "Evening", updatedAt: 9100 },
    ],
    deletedBaniIds: [4],
    settings: { enabled: true, sound: "waheguru", updatedAt: 9200 },
    syncedAt: 9300,
  };

  it("builds the list from the server rows, keeping local names and adopting custom titles", () => {
    const baniById = new Map([[21, { translit: "Rehras Sahib", gurmukhi: "rhrwis" }]]);
    const out = applySyncResult(result, {
      items: [item()],
      meta,
      baniById,
      timeForPrefix: "Time for",
    });
    expect(out.items).toEqual([
      expect.objectContaining({
        key: 2,
        time: "5:45 AM",
        translit: "Japji Sahib",
        titleCustom: false,
        title: "Time for Japji Sahib",
      }),
      expect.objectContaining({
        key: 21,
        time: "6:30 PM",
        enabled: false,
        translit: "Rehras Sahib",
        title: "Evening",
        titleCustom: true,
      }),
    ]);
    expect(out.settings).toEqual({ enabled: true, sound: "waheguru" });
  });

  it("records the server clocks as the new base and retires honoured tombstones", () => {
    const out = applySyncResult(result, { items: [], meta });
    expect(out.meta.base).toEqual({ 2: 9000, 21: 9100 });
    expect(out.meta.clocks).toEqual({ 2: 9000, 21: 9100 });
    expect(out.meta.tombstones).toEqual({}); // 4 confirmed, 9 no longer on the server
    expect(out.meta.settingsUpdatedAt).toBe(0);
    expect(out.meta.settingsBase).toBe(9200);
    expect(out.meta.lastSyncedAt).toBe(9300);
  });

  it("a server without settings leaves the local switches alone", () => {
    const out = applySyncResult({ reminders: [], syncedAt: 1 }, { items: [], meta });
    expect(out.settings).toBeNull();
  });
});

describe("itemFromRow / sameSchedule", () => {
  it("falls back to the bani database for names, and an empty title without them", () => {
    expect(itemFromRow({ baniId: 6, time: "07:00", enabled: true, title: null }).title).toBe("");
    expect(
      itemFromRow(
        { baniId: 6, time: "07:00", enabled: true, title: null },
        { bani: { translit: "Tav Prasad" }, timeForPrefix: "Time for" }
      ).title
    ).toBe("Time for Tav Prasad");
  });

  it("compares what the OS would schedule, not cosmetic fields", () => {
    expect(sameSchedule([item()], [item({ gurmukhi: "x" })])).toBe(true);
    expect(sameSchedule([item()], [item({ time: "5:31 AM" })])).toBe(false);
    expect(sameSchedule([item()], [])).toBe(false);
  });
});
