/* eslint-env jest */
// Actions are built from `actionTypes` rather than imported from `./actions`:
// that barrel pulls in Firebase analytics, which Jest does not transform.
import * as actionTypes from "./actions/actionTypes";
import rootReducer from "./reducer";

const init = () => rootReducer(undefined, { type: "@@INIT" });
const reduce = (state, ...actions) => actions.reduce((s, a) => rootReducer(s, a), state);

const op = (feature, kind, key) => ({
  type: actionTypes.ENQUEUE_SYNC_OP,
  payload: { feature, kind, key },
});

describe("syncOutbox slice", () => {
  it("queues, sends, completes and retries through the model", () => {
    let s = reduce(init(), op("reminders", "upsert", 2));
    const [id] = Object.keys(s.syncOutbox.ops);
    s = reduce(s, { type: actionTypes.SYNC_OP_SENDING, payload: { id } });
    expect(s.syncOutbox.ops[id].status).toBe("sending");
    s = reduce(s, { type: actionTypes.SYNC_OP_FAILED, payload: { id, error: "offline" } });
    expect(s.syncOutbox.ops[id]).toMatchObject({
      status: "queued",
      attempts: 1,
      lastError: "offline",
    });
    s = reduce(s, { type: actionTypes.SYNC_OP_DONE, payload: { id } });
    expect(s.syncOutbox.ops).toEqual({});
  });

  it("heals in-flight ops on rehydrate", () => {
    let s = reduce(init(), op("pothis", "put", "mypothi"));
    const [id] = Object.keys(s.syncOutbox.ops);
    s = reduce(s, { type: actionTypes.SYNC_OP_SENDING, payload: { id } });
    const rehydrated = rootReducer(init(), {
      type: "persist/REHYDRATE",
      payload: { syncOutbox: s.syncOutbox },
    });
    expect(rehydrated.syncOutbox.ops[id].status).toBe("queued");
  });

  it("is wiped, with the reminder clocks, when a different account signs in", () => {
    let s = reduce(init(), op("reminders", "upsert", 2), {
      type: actionTypes.MERGE_REMINDER_SYNC_META,
      payload: { clocks: { 2: 5 } },
    });
    expect(Object.keys(s.syncOutbox.ops)).toHaveLength(1);
    s = reduce(s, { type: actionTypes.CLEAR_USER_DATA });
    expect(s.syncOutbox.ops).toEqual({});
    expect(s.remindersSync.clocks).toEqual({});
  });
});

describe("remindersSync slice", () => {
  it("merges clocks, tombstones and bases, and removes on request", () => {
    let s = reduce(init(), {
      type: actionTypes.MERGE_REMINDER_SYNC_META,
      payload: { clocks: { 2: 10 }, tombstones: { 4: 11 }, base: { 2: 9 }, settingsUpdatedAt: 7 },
    });
    expect(s.remindersSync).toMatchObject({
      clocks: { 2: 10 },
      tombstones: { 4: 11 },
      base: { 2: 9 },
      settingsUpdatedAt: 7,
    });
    s = reduce(s, {
      type: actionTypes.MERGE_REMINDER_SYNC_META,
      payload: { removeTombstones: [4], removeClocks: [2], lastSyncedAt: 100 },
    });
    expect(s.remindersSync).toMatchObject({
      clocks: {},
      tombstones: {},
      base: {},
      lastSyncedAt: 100,
    });
  });

  it("replace swaps the whole record", () => {
    const s = reduce(
      init(),
      { type: actionTypes.MERGE_REMINDER_SYNC_META, payload: { clocks: { 2: 10 } } },
      {
        type: actionTypes.MERGE_REMINDER_SYNC_META,
        payload: { replace: { base: { 9: 1 }, lastSyncedAt: 5 } },
      }
    );
    expect(s.remindersSync).toEqual({
      clocks: {},
      tombstones: {},
      base: { 9: 1 },
      settingsUpdatedAt: 0,
      settingsBase: 0,
      lastSyncedAt: 5,
    });
  });
});

describe("preference clocks", () => {
  it("stamp the layout and profile on every edit, and keep a restored clock", () => {
    const before = Date.now();
    let s = reduce(init(), {
      type: actionTypes.SET_DASHBOARD_LAYOUT,
      value: { order: [], hidden: [] },
    });
    expect(s.dashboardLayout.modifiedAt).toBeGreaterThanOrEqual(before);
    s = reduce(s, {
      type: actionTypes.SET_USER_PROFILE,
      value: { name: "Bhuvesh", modifiedAt: 123 },
    });
    expect(s.userProfile).toEqual({ name: "Bhuvesh", modifiedAt: 123 });
    const rehydrated = rootReducer(init(), {
      type: "persist/REHYDRATE",
      payload: { dashboardLayout: { ...s.dashboardLayout, modifiedAt: 456 } },
    });
    expect(rehydrated.dashboardLayout.modifiedAt).toBe(456);
  });
});
