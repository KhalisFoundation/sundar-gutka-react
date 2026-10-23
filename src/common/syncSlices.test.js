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

  it("is wiped, with the settings clocks, when a different account signs in", () => {
    let s = reduce(init(), op("settings", "put", "baniOrder"), {
      type: actionTypes.MERGE_SETTINGS_SYNC_META,
      payload: { clocks: { baniOrder: 5 } },
    });
    expect(Object.keys(s.syncOutbox.ops)).toHaveLength(1);
    s = reduce(s, { type: actionTypes.CLEAR_USER_DATA });
    expect(s.syncOutbox.ops).toEqual({});
    expect(s.settingsSync.clocks).toEqual({});
  });
});

describe("settingsSync slice", () => {
  it("merges clocks and bases, removes on request, and keeps the watermark", () => {
    let s = reduce(init(), {
      type: actionTypes.MERGE_SETTINGS_SYNC_META,
      payload: { clocks: { theme: 10, fontSize: 4 }, base: { theme: 9 }, lastSyncedAt: 7 },
    });
    expect(s.settingsSync).toEqual({
      clocks: { theme: 10, fontSize: 4 },
      base: { theme: 9 },
      lastSyncedAt: 7,
    });
    s = reduce(s, {
      type: actionTypes.MERGE_SETTINGS_SYNC_META,
      payload: { removeClocks: ["fontSize"] },
    });
    expect(s.settingsSync.clocks).toEqual({ theme: 10 });
    expect(s.settingsSync.lastSyncedAt).toBe(7);
  });

  it("replace swaps the whole record", () => {
    let s = reduce(init(), {
      type: actionTypes.MERGE_SETTINGS_SYNC_META,
      payload: { clocks: { theme: 10 } },
    });
    s = reduce(s, {
      type: actionTypes.MERGE_SETTINGS_SYNC_META,
      payload: { replace: { base: { theme: 3 } } },
    });
    expect(s.settingsSync).toEqual({ clocks: {}, base: { theme: 3 }, lastSyncedAt: 0 });
  });
});
