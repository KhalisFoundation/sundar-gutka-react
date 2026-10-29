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
const mockUpdateReminders = jest.fn(() => Promise.resolve({ scheduled: 1, blocked: false }));
let mockOnline = true;
jest.mock("@common", () => ({
  logError: jest.fn(),
  logNetworkError: jest.fn(),
  logMessage: jest.fn(),
  STRINGS: { time_for: "Time for" },
  updateReminders: (...a) => mockUpdateReminders(...a),
  useNetwork: () => ({ isOnline: mockOnline }),
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
    clearSyncFeature: (feature) => ({ type: types.CLEAR_SYNC_FEATURE, payload: { feature } }),
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
    expect(mockUpdateReminders).toHaveBeenCalledTimes(1);
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
});
