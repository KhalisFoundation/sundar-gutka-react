/* eslint-env jest */
import React from "react";
import { Provider } from "react-redux";

import { configureStore } from "@reduxjs/toolkit";
import { act, render } from "@testing-library/react-native";

import * as actionTypes from "@common/actions/actionTypes";
import rootReducer from "@common/reducer";

import useRemindersSync, { FEATURE } from "./useRemindersSync";

// The store is REAL (the app's reducer), so the outbox, the clocks and the
// reminder list behave exactly as on a phone; only the network, the OS
// scheduler and the bani database are mocked. setupTests replaces react-redux
// with a static stub app-wide; this suite needs one wired to a live store.
jest.mock("react-redux", () => require("@common/test-utils/mocks/storeRedux").mock);

const mockApi = {
  putReminder: jest.fn(),
  deleteReminder: jest.fn(),
  putReminderSettings: jest.fn(),
  syncReminders: jest.fn(),
};
jest.mock("../remindersApi", () => ({
  putReminder: (...a) => mockApi.putReminder(...a),
  deleteReminder: (...a) => mockApi.deleteReminder(...a),
  putReminderSettings: (...a) => mockApi.putReminderSettings(...a),
  syncReminders: (...a) => mockApi.syncReminders(...a),
}));
const mockRegister = jest.fn(() => () => {});
jest.mock("../sync/syncRegistry", () => ({
  OUTCOME_DONE: "done",
  OUTCOME_RETRY: "retry",
  OUTCOME_CONFLICT: "conflict",
  OUTCOME_FATAL: "fatal",
  registerSyncFeature: (...a) => mockRegister(...a),
}));
const mockRearm = jest.fn(() => Promise.resolve(1));
const mockCancelTriggers = jest.fn(() => Promise.resolve());
jest.mock("@common/notifications", () => ({
  rearmReminders: (...a) => mockRearm(...a),
  cancelReminderTriggers: (...a) => mockCancelTriggers(...a),
}));
let mockOnline = true;
let mockCanDeliver = true;
jest.mock("@common", () => ({
  logError: jest.fn(),
  logNetworkError: jest.fn(),
  logMessage: jest.fn(),
  STRINGS: { time_for: "Time for" },
  useNetwork: () => ({ isOnline: mockOnline }),
  hasNotificationPermission: () => Promise.resolve(mockCanDeliver),
  canScheduleExactAlarms: () => Promise.resolve(mockCanDeliver),
}));
jest.mock("@database", () => ({
  getBaniList: jest.fn(() =>
    Promise.resolve([
      { id: 2, translit: "Japji Sahib", gurmukhi: "jpujI" },
      { id: 21, translit: "Rehras Sahib", gurmukhi: "rhrwis" },
    ])
  ),
}));
jest.mock("@common/actions", () => {
  const types = jest.requireActual("@common/actions/actionTypes");
  return {
    syncOpDone: (id) => ({ type: types.SYNC_OP_DONE, payload: { id } }),
    enqueueSyncOp: (op) => ({ type: types.ENQUEUE_SYNC_OP, payload: op }),
    mergeReminderSyncMeta: (patch) => ({ type: types.MERGE_REMINDER_SYNC_META, payload: patch }),
    setReminderBanis: (value) => ({ type: types.SET_REMINDER_BANIS, value }),
    setReminderSound: (value) => ({ type: types.SET_REMINDER_SOUND, value }),
    toggleReminders: (value) => ({ type: types.TOGGLE_REMINDERS, value }),
  };
});

const item = (key, over = {}) => ({
  key,
  id: key,
  gurmukhi: "",
  translit: key === 2 ? "Japji Sahib" : "Rehras Sahib",
  enabled: true,
  time: "5:30 AM",
  title: "Time for x",
  ...over,
});

const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (gdm) => gdm({ serializableCheck: false, immutableCheck: false }),
  });

const Host = () => {
  useRemindersSync();
  return null;
};

const signIn = (store) =>
  store.dispatch({
    type: actionTypes.SET_AUTH_SESSION,
    value: { user: { email: "a@x" }, expiresAt: null },
  });

const ops = (store) => Object.values(store.getState().syncOutbox.ops);
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const emptySync = { reminders: [], deletedBaniIds: [], settings: null, syncedAt: 1 };

describe("useRemindersSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnline = true;
    mockCanDeliver = true;
    mockApi.syncReminders.mockResolvedValue({ ok: true, status: 200, data: emptySync });
  });

  it("registers the reminders feature", () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    expect(mockRegister).toHaveBeenCalledWith(FEATURE, expect.any(Object));
  });

  it("turns a local edit into stamped outbox ops", async () => {
    const store = makeStore();
    signIn(store);
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await flush();
    await act(async () => {
      store.dispatch({
        type: actionTypes.SET_REMINDER_BANIS,
        value: JSON.stringify([item(2), item(21, { time: "6:00 PM" })]),
      });
    });
    expect(ops(store).map((o) => [o.kind, o.key])).toEqual([
      ["upsert", 2],
      ["upsert", 21],
    ]);
    expect(ops(store)[1].payload).toEqual({ time: "18:00", enabled: true, title: null });
    expect(store.getState().remindersSync.clocks).toEqual({
      2: expect.any(Number),
      21: expect.any(Number),
    });

    await act(async () => {
      store.dispatch({ type: actionTypes.SET_REMINDER_BANIS, value: JSON.stringify([item(2)]) });
    });
    const del = ops(store).find((o) => o.kind === "delete");
    expect(del.key).toBe(21);
    expect(store.getState().remindersSync.tombstones[21]).toEqual(expect.any(Number));

    await act(async () => {
      store.dispatch({ type: actionTypes.TOGGLE_REMINDERS, value: true });
    });
    expect(ops(store).find((o) => o.kind === "settings").payload).toMatchObject({
      enabled: true,
      sound: "default",
    });
  });

  it("reconcile applies the account's list, rescheduling once", async () => {
    mockApi.syncReminders.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        reminders: [{ baniId: 21, time: "18:30", enabled: true, title: null, updatedAt: 50 }],
        deletedBaniIds: [],
        settings: { enabled: true, sound: "waheguru", updatedAt: 60 },
        syncedAt: 70,
      },
    });
    const store = makeStore();
    store.dispatch({ type: actionTypes.SET_REMINDER_BANIS, value: JSON.stringify([item(2)]) });
    signIn(store);
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await flush();
    const impl = mockRegister.mock.calls[mockRegister.mock.calls.length - 1][1];
    await act(async () => {
      await impl.reconcile();
    });
    expect(mockApi.syncReminders).toHaveBeenCalledWith(
      expect.objectContaining({
        reminders: [expect.objectContaining({ baniId: 2 })],
        lastSyncedAt: 0,
      })
    );
    const list = JSON.parse(store.getState().reminderBanis);
    expect(list).toEqual([
      expect.objectContaining({
        key: 21,
        time: "6:30 PM",
        translit: "Rehras Sahib",
        title: "Time for Rehras Sahib",
      }),
    ]);
    expect(store.getState().isReminders).toBe(true);
    expect(store.getState().reminderSound).toBe("waheguru");
    expect(store.getState().remindersSync).toMatchObject({
      base: { 21: 50 },
      lastSyncedAt: 70,
      settingsBase: 60,
    });
    expect(mockRearm).toHaveBeenCalledTimes(1);
    // Applying the account's copy is not the user editing: nothing queued.
    expect(ops(store)).toEqual([]);
  });

  it("drains ops with the right outcomes", async () => {
    const store = makeStore();
    signIn(store);
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await flush();
    const impl = mockRegister.mock.calls[mockRegister.mock.calls.length - 1][1];
    // Synced with this account before, so ops may go on their own.
    store.dispatch({ type: actionTypes.MERGE_REMINDER_SYNC_META, payload: { lastSyncedAt: 1 } });

    // The base clock is taken at SEND time, so an op queued behind another
    // still carries the server clock that other op just returned.
    store.dispatch({ type: actionTypes.MERGE_REMINDER_SYNC_META, payload: { base: { 2: 7 } } });
    mockApi.putReminder.mockResolvedValueOnce({ ok: true, status: 200, data: { updatedAt: 99 } });
    expect(
      await impl.drain({ kind: "upsert", key: 2, payload: { time: "05:30", enabled: true } })
    ).toBe("done");
    expect(mockApi.putReminder).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ time: "05:30", baseUpdatedAt: 7 })
    );
    expect(store.getState().remindersSync.base[2]).toBe(99);

    mockApi.putReminder.mockResolvedValueOnce({ ok: false, status: 409 });
    expect(await impl.drain({ kind: "upsert", key: 2, payload: {} })).toBe("conflict");
    mockApi.putReminder.mockResolvedValueOnce({ ok: false, status: 0 });
    expect(await impl.drain({ kind: "upsert", key: 2, payload: {} })).toBe("retry");
    mockApi.putReminder.mockResolvedValueOnce({ ok: false, status: 400 });
    expect(await impl.drain({ kind: "upsert", key: 2, payload: {} })).toBe("fatal");
    // A fault in the request itself, not the network: retrying cannot help.
    mockApi.putReminder.mockResolvedValueOnce({ ok: false, status: 0, error: "failed" });
    expect(await impl.drain({ kind: "upsert", key: 2, payload: {} })).toBe("fatal");

    mockApi.deleteReminder.mockResolvedValueOnce({ ok: true, status: 204 });
    expect(await impl.drain({ kind: "delete", key: 2 })).toBe("done");
    mockApi.putReminderSettings.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { updatedAt: 5 },
    });
    expect(await impl.drain({ kind: "settings", key: "settings", payload: {} })).toBe("done");
    expect(store.getState().remindersSync.settingsBase).toBe(5);
  });

  it("does nothing while signed out", async () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await flush();
    expect(mockApi.syncReminders).not.toHaveBeenCalled();
  });

  // ── The outbox contract, the account boundary and the app's own writes ──

  const mount = async (store) => {
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await flush();
    return mockRegister.mock.calls[mockRegister.mock.calls.length - 1][1];
  };
  const synced = (store) =>
    store.dispatch({ type: actionTypes.MERGE_REMINDER_SYNC_META, payload: { lastSyncedAt: 1 } });

  // No server clock is known yet, so a PUT would overwrite another device's
  // newer reminder unchecked. The bulk sync merges per reminder instead.
  it("answers an op before the first sync with this account as a conflict", async () => {
    const store = makeStore();
    signIn(store);
    const impl = await mount(store);
    expect(await impl.drain({ kind: "upsert", key: 2, payload: {} })).toBe("conflict");
    expect(mockApi.putReminder).not.toHaveBeenCalled();
  });

  // Sign-out purges before the session ends. Read as the person deleting every
  // reminder, it queued a DELETE for each, sent to the account still signed in.
  it("does not take the sign-out purge for deletions", async () => {
    const store = makeStore();
    store.dispatch({
      type: actionTypes.SET_REMINDER_BANIS,
      value: JSON.stringify([item(2), item(21)]),
    });
    signIn(store);
    await mount(store);
    await act(async () => {
      store.dispatch({ type: actionTypes.CLEAR_USER_DATA });
    });
    expect(ops(store)).toEqual([]);
    expect(store.getState().remindersSync.tombstones).toEqual({});
  });

  it("marks done only the ops the bulk sync carried", async () => {
    const store = makeStore();
    signIn(store);
    const impl = await mount(store);
    await act(async () => {
      store.dispatch({ type: actionTypes.SET_REMINDER_BANIS, value: JSON.stringify([item(2)]) });
    });
    const [carried] = ops(store);
    // An edit lands while the sync is out: a new op the payload never saw.
    mockApi.syncReminders.mockImplementationOnce(async () => {
      store.dispatch({
        type: actionTypes.SET_REMINDER_BANIS,
        value: JSON.stringify([item(2), item(21)]),
      });
      return { ok: true, status: 200, data: emptySync };
    });
    await act(async () => {
      await impl.reconcile();
    });
    const left = ops(store);
    expect(left.map((o) => o.id)).not.toContain(carried.id);
    expect(left.map((o) => [o.kind, o.key])).toEqual([["upsert", 21]]);
  });

  // A later edit to the SAME reminder merges into the op still waiting: same
  // id, new contents. The payload carried the old contents, so it must stay.
  it("keeps an op that took in a later edit while the sync was out", async () => {
    const store = makeStore();
    signIn(store);
    const impl = await mount(store);
    await act(async () => {
      store.dispatch({ type: actionTypes.SET_REMINDER_BANIS, value: JSON.stringify([item(2)]) });
    });
    const [carried] = ops(store);
    mockApi.syncReminders.mockImplementationOnce(async () => {
      store.dispatch({
        type: actionTypes.SET_REMINDER_BANIS,
        value: JSON.stringify([item(2, { time: "7:00 AM" })]),
      });
      return { ok: true, status: 200, data: emptySync };
    });
    await act(async () => {
      await impl.reconcile();
    });
    const [left] = ops(store);
    expect(left.id).toBe(carried.id);
    expect(left.payload.time).toBe("07:00");
  });

  it("clears the tombstone of a reminder added back before the delete went up", async () => {
    const store = makeStore();
    store.dispatch({ type: actionTypes.SET_REMINDER_BANIS, value: JSON.stringify([item(2)]) });
    signIn(store);
    await mount(store);
    await act(async () => {
      store.dispatch({ type: actionTypes.SET_REMINDER_BANIS, value: JSON.stringify([]) });
    });
    expect(store.getState().remindersSync.tombstones[2]).toEqual(expect.any(Number));
    await act(async () => {
      store.dispatch({ type: actionTypes.SET_REMINDER_BANIS, value: JSON.stringify([item(2)]) });
    });
    expect(store.getState().remindersSync.tombstones[2]).toBeUndefined();
    expect(ops(store).map((o) => [o.kind, o.key])).toEqual([["upsert", 2]]);
  });

  it("reschedules a synced change in the script the person reads", async () => {
    mockApi.syncReminders.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ...emptySync,
        reminders: [{ baniId: 21, time: "18:30", enabled: true, updatedAt: 5 }],
      },
    });
    const store = makeStore();
    store.dispatch({ type: actionTypes.TOGGLE_TRANSLITERATION, value: true });
    store.dispatch({ type: actionTypes.TOGGLE_REMINDERS, value: true });
    signIn(store);
    const impl = await mount(store);
    await act(async () => {
      await impl.reconcile();
    });
    expect(mockRearm).toHaveBeenCalledWith(expect.anything(), expect.any(String), true);
  });

  it("does not switch reminders on from the account where this phone cannot deliver", async () => {
    mockCanDeliver = false;
    mockApi.syncReminders.mockResolvedValue({
      ok: true,
      status: 200,
      data: { ...emptySync, settings: { enabled: true, sound: "default", updatedAt: 6 } },
    });
    const store = makeStore();
    signIn(store);
    const impl = await mount(store);
    await act(async () => {
      await impl.reconcile();
    });
    expect(store.getState().isReminders).toBe(false);
    expect(ops(store)).toEqual([]);
  });

  // A change from another phone rewrites the schedule only; clearing the shade
  // would throw away a reminder still unread here.
  it("takes the schedule down without clearing the shade when switched off elsewhere", async () => {
    mockApi.syncReminders.mockResolvedValue({
      ok: true,
      status: 200,
      data: { ...emptySync, settings: { enabled: false, sound: "default", updatedAt: 6 } },
    });
    const store = makeStore();
    store.dispatch({ type: actionTypes.TOGGLE_REMINDERS, value: true });
    signIn(store);
    const impl = await mount(store);
    await act(async () => {
      await impl.reconcile();
    });
    expect(store.getState().isReminders).toBe(false);
    expect(mockCancelTriggers).toHaveBeenCalledTimes(1);
    expect(mockRearm).not.toHaveBeenCalled();
  });

  it("keeps this device's sound when the account's settings carry none", async () => {
    mockApi.syncReminders.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ...emptySync,
        reminders: [{ baniId: 21, time: "18:30", enabled: true, updatedAt: 5 }],
        settings: { enabled: true, updatedAt: 6 },
      },
    });
    const store = makeStore();
    store.dispatch({ type: actionTypes.TOGGLE_REMINDERS, value: true });
    store.dispatch({ type: actionTypes.SET_REMINDER_SOUND, value: "waheguru_soul.mp3" });
    signIn(store);
    const impl = await mount(store);
    await act(async () => {
      await impl.reconcile();
    });
    expect(store.getState().reminderSound).toBe("waheguru_soul.mp3");
    expect(mockRearm).toHaveBeenCalledWith("waheguru_soul.mp3", expect.any(String), false);
  });

  // The answer is older than that edit; applied, it would have undone it here.
  it("does not lay a sync answer over an edit made while it was out", async () => {
    const store = makeStore();
    signIn(store);
    const impl = await mount(store);
    mockApi.syncReminders.mockImplementationOnce(async () => {
      store.dispatch({ type: actionTypes.SET_REMINDER_BANIS, value: JSON.stringify([item(2)]) });
      return {
        ok: true,
        status: 200,
        data: { ...emptySync, reminders: [{ baniId: 21, time: "18:30", updatedAt: 5 }] },
      };
    });
    await act(async () => {
      await impl.reconcile();
    });
    expect(JSON.parse(store.getState().reminderBanis).map((r) => r.key)).toEqual([2]);
  });

  it("drops a sync answer that lands after the account was purged", async () => {
    const store = makeStore();
    signIn(store);
    const impl = await mount(store);
    mockApi.syncReminders.mockImplementationOnce(async () => {
      store.dispatch({ type: actionTypes.CLEAR_USER_DATA });
      return {
        ok: true,
        status: 200,
        data: { ...emptySync, reminders: [{ baniId: 21, time: "18:30", updatedAt: 5 }] },
      };
    });
    let ok;
    await act(async () => {
      ok = await impl.reconcile();
    });
    expect(ok).toBe(false);
    expect(JSON.parse(store.getState().reminderBanis)).toEqual([]);
    expect(store.getState().remindersSync.lastSyncedAt).toBe(0);
  });

  it("a PUT answered after a purge is done and records nothing", async () => {
    const store = makeStore();
    signIn(store);
    synced(store);
    const impl = await mount(store);
    mockApi.putReminder.mockImplementationOnce(async () => {
      store.dispatch({ type: actionTypes.CLEAR_USER_DATA });
      return { ok: true, status: 200, data: { updatedAt: 99 } };
    });
    expect(await impl.drain({ kind: "upsert", key: 2, payload: {} })).toBe("done");
    expect(store.getState().remindersSync.base).toEqual({});
  });

  it("a PUT answered after the session ended stays queued for it", async () => {
    const store = makeStore();
    signIn(store);
    synced(store);
    const impl = await mount(store);
    mockApi.putReminder.mockImplementationOnce(async () => {
      store.dispatch({ type: actionTypes.CLEAR_AUTH_SESSION });
      return { ok: true, status: 200, data: { updatedAt: 99 } };
    });
    expect(await impl.drain({ kind: "upsert", key: 2, payload: {} })).toBe("retry");
  });

  // A newer edit to the same reminder queued behind this op needs its clock.
  it("keeps a newer local clock when a PUT lands", async () => {
    const store = makeStore();
    signIn(store);
    synced(store);
    store.dispatch({ type: actionTypes.MERGE_REMINDER_SYNC_META, payload: { clocks: { 2: 10 } } });
    const impl = await mount(store);
    mockApi.putReminder.mockImplementationOnce(async () => {
      store.dispatch({
        type: actionTypes.MERGE_REMINDER_SYNC_META,
        payload: { clocks: { 2: 500 } },
      });
      return { ok: true, status: 200, data: { updatedAt: 99 } };
    });
    await impl.drain({ kind: "upsert", key: 2, payload: {} });
    expect(store.getState().remindersSync.clocks[2]).toBe(500);
    expect(store.getState().remindersSync.base[2]).toBe(99);
  });

  // Defaults filling an empty list, or reminders switched off because this
  // phone lost a permission, are not the person editing.
  it("does not queue the app's own writes", async () => {
    const { asAppWrite } = require("@common/settings/appWrite");
    const store = makeStore();
    signIn(store);
    await mount(store);
    await act(async () => {
      asAppWrite(() =>
        store.dispatch({ type: actionTypes.SET_REMINDER_BANIS, value: JSON.stringify([item(2)]) })
      );
    });
    expect(ops(store)).toEqual([]);
    expect(store.getState().remindersSync.clocks).toEqual({});
  });

  // Sign-out's last push: an edit made after the running sync built its
  // payload must still go up before the outbox is dropped.
  it("a fresh reconcile runs again after the one already out", async () => {
    const store = makeStore();
    signIn(store);
    const impl = await mount(store);
    let release;
    mockApi.syncReminders.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ok: true, status: 200, data: emptySync });
        })
    );
    let first;
    let fresh;
    await act(async () => {
      first = impl.reconcile();
      fresh = impl.reconcile({ fresh: true });
      release();
      await Promise.all([first, fresh]);
    });
    expect(mockApi.syncReminders).toHaveBeenCalledTimes(2);
  });
});
