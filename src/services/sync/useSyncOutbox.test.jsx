/* eslint-env jest */
import React from "react";
import { Provider } from "react-redux";

import { configureStore } from "@reduxjs/toolkit";
import { act, render } from "@testing-library/react-native";

import * as actionTypes from "@common/actions/actionTypes";
import rootReducer from "@common/reducer";

import { registerSyncFeature, resetSyncRegistry } from "./syncRegistry";
import useSyncOutbox from "./useSyncOutbox";

// setupTests replaces react-redux with a static stub app-wide; this suite
// drives a real store through a Provider wired to it.
jest.mock("react-redux", () => require("@common/test-utils/mocks/storeRedux").mock);

let mockOnline = true;
const mockLogError = jest.fn();
jest.mock("@common", () => ({
  logError: (...a) => mockLogError(...a),
  logMessage: jest.fn(),
  useNetwork: () => ({ isOnline: mockOnline }),
}));
jest.mock("@common/actions", () => {
  const types = jest.requireActual("@common/actions/actionTypes");
  return {
    syncOpDone: (id) => ({ type: types.SYNC_OP_DONE, payload: { id } }),
    syncOpFailed: (id, error) => ({ type: types.SYNC_OP_FAILED, payload: { id, error } }),
    syncOpSending: (id) => ({ type: types.SYNC_OP_SENDING, payload: { id } }),
  };
});

const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (gdm) => gdm({ serializableCheck: false, immutableCheck: false }),
  });
const Host = () => {
  useSyncOutbox();
  return null;
};
const signIn = (store) =>
  store.dispatch({ type: actionTypes.SET_AUTH_SESSION, value: { user: { email: "a@x" } } });
const enqueue = (store, feature, kind, key) =>
  store.dispatch({ type: actionTypes.ENQUEUE_SYNC_OP, payload: { feature, kind, key } });
const ops = (store) => Object.values(store.getState().syncOutbox.ops);
const settle = async () => {
  await act(async () => {
    await new Promise((r) => {
      setTimeout(r, 0);
    });
  });
};

describe("useSyncOutbox", () => {
  beforeEach(() => {
    resetSyncRegistry();
    mockOnline = true;
    jest.clearAllMocks();
  });

  it("sends queued ops in order and removes them when done", async () => {
    const sent = [];
    registerSyncFeature("reminders", {
      drain: async (op) => {
        sent.push(op.key);
        return "done";
      },
    });
    const store = makeStore();
    signIn(store);
    enqueue(store, "reminders", "upsert", 2);
    enqueue(store, "reminders", "upsert", 4);
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await settle();
    expect(sent).toEqual([2, 4]);
    expect(ops(store)).toEqual([]);
  });

  it("keeps an op and backs off on retry; drops it on fatal", async () => {
    registerSyncFeature("reminders", { drain: async (op) => (op.key === 2 ? "retry" : "fatal") });
    const store = makeStore();
    signIn(store);
    enqueue(store, "reminders", "upsert", 2);
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await settle();
    expect(ops(store)).toHaveLength(1);
    expect(ops(store)[0]).toMatchObject({ status: "queued", attempts: 1 });
    expect(ops(store)[0].nextAttemptAt).toBeGreaterThan(Date.now());

    const store2 = makeStore();
    signIn(store2);
    enqueue(store2, "reminders", "upsert", 9);
    render(
      <Provider store={store2}>
        <Host />
      </Provider>
    );
    await settle();
    expect(ops(store2)).toEqual([]);
    expect(mockLogError).toHaveBeenCalled();
  });

  it("on a conflict, hands the feature to its bulk reconcile, which finishes the queue", async () => {
    const store = makeStore();
    // A reconcile marks done the ops its push carried (see syncRegistry).
    const reconcile = jest.fn(async () => {
      ops(store).forEach(({ id }) =>
        store.dispatch({ type: actionTypes.SYNC_OP_DONE, payload: { id } })
      );
      return true;
    });
    registerSyncFeature("reminders", { drain: async () => "conflict", reconcile });
    signIn(store);
    enqueue(store, "reminders", "upsert", 2);
    enqueue(store, "reminders", "upsert", 4);
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await settle();
    expect(reconcile).toHaveBeenCalledTimes(1);
    expect(ops(store)).toEqual([]);
  });

  // The conflicting change is not dropped ahead of a reconcile that may not
  // get through: it stays queued and is retried with backoff.
  it("keeps the conflicting op, rescheduled, when the reconcile fails", async () => {
    registerSyncFeature("reminders", {
      drain: async () => "conflict",
      reconcile: async () => false,
    });
    const store = makeStore();
    signIn(store);
    enqueue(store, "reminders", "upsert", 2);
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await settle();
    expect(ops(store)).toHaveLength(1);
    expect(ops(store)[0]).toMatchObject({ status: "queued", lastError: "conflict" });
    expect(ops(store)[0].nextAttemptAt).toBeGreaterThan(Date.now());
  });

  // A conflict can join a reconcile that was already running, built before
  // this op existed. It answers true but never finished the op, which was left
  // "sending" and held up every later op of the feature.
  it("re-queues a conflicting op that the reconcile it joined did not carry", async () => {
    registerSyncFeature("reminders", {
      drain: async () => "conflict",
      reconcile: async () => true,
    });
    const store = makeStore();
    signIn(store);
    enqueue(store, "reminders", "upsert", 2);
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await settle();
    expect(ops(store)).toHaveLength(1);
    expect(ops(store)[0].status).toBe("queued");
  });

  it("does not send while signed out or offline", async () => {
    const drain = jest.fn(async () => "done");
    registerSyncFeature("reminders", { drain });
    const store = makeStore();
    enqueue(store, "reminders", "upsert", 2);
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await settle();
    expect(drain).not.toHaveBeenCalled();

    mockOnline = false;
    const store2 = makeStore();
    signIn(store2);
    enqueue(store2, "reminders", "upsert", 2);
    render(
      <Provider store={store2}>
        <Host />
      </Provider>
    );
    await settle();
    expect(drain).not.toHaveBeenCalled();
    expect(ops(store2)).toHaveLength(1);
  });

  it("features drain independently of one another", async () => {
    const seen = [];
    registerSyncFeature("reminders", {
      drain: async () => {
        seen.push("reminders");
        return "retry";
      },
    });
    registerSyncFeature("pothis", {
      drain: async () => {
        seen.push("pothis");
        return "done";
      },
    });
    const store = makeStore();
    signIn(store);
    enqueue(store, "reminders", "upsert", 2);
    enqueue(store, "pothis", "put", "mypothi");
    render(
      <Provider store={store}>
        <Host />
      </Provider>
    );
    await settle();
    expect(seen.sort()).toEqual(["pothis", "reminders"]);
    expect(ops(store).map((o) => o.feature)).toEqual(["reminders"]);
  });
});
