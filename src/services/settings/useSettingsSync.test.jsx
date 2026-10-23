/* eslint-env jest */
import React from "react";
import { Provider } from "react-redux";

import { configureStore } from "@reduxjs/toolkit";
import { act, render } from "@testing-library/react-native";

import * as actionTypes from "@common/actions/actionTypes";
import rootReducer from "@common/reducer";
import { asAppWrite } from "@common/settings/appWrite";

import { getSyncFeature, resetSyncRegistry } from "../sync/syncRegistry";

import useSettingsSync, { ENQUEUE_DEBOUNCE_MS, FEATURE } from "./useSettingsSync";

// The settings sync against a real store: what a reconcile or a PUT may do to
// edits the user makes while it is in flight.

jest.mock("react-redux", () => require("@common/test-utils/mocks/storeRedux").mock);
jest.mock("@common", () => ({
  constant: { Default: "Default", Light: "Light", Dark: "Dark" },
  logMessage: jest.fn(),
  logNetworkError: jest.fn(),
}));
jest.mock("@common/localization", () => ({ setLanguage: jest.fn() }));
jest.mock("@common/actions", () => {
  const types = jest.requireActual("@common/actions/actionTypes");
  return {
    enqueueSyncOp: (op) => ({ type: types.ENQUEUE_SYNC_OP, payload: op }),
    mergeSettingsSyncMeta: (payload) => ({ type: types.MERGE_SETTINGS_SYNC_META, payload }),
    syncOpDone: (id) => ({ type: types.SYNC_OP_DONE, payload: { id } }),
  };
});

const mockSyncSettings = jest.fn();
const mockPutSetting = jest.fn();
jest.mock("../settingsApi", () => ({
  syncSettings: (...a) => mockSyncSettings(...a),
  putSetting: (...a) => mockPutSetting(...a),
}));

const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (gdm) => gdm({ serializableCheck: false, immutableCheck: false }),
  });
const Host = () => {
  useSettingsSync();
  return null;
};
const setup = () => {
  const store = makeStore();
  store.dispatch({ type: actionTypes.SET_AUTH_SESSION, value: { user: { email: "a@x" } } });
  render(
    <Provider store={store}>
      <Host />
    </Provider>
  );
  return { store, feature: getSyncFeature(FEATURE) };
};
const settingsOps = (store) =>
  Object.values(store.getState().syncOutbox.ops).filter((op) => op.feature === FEATURE);
// This account has been bulk-synced before, so single-key PUTs are allowed.
const synced = (store) =>
  store.dispatch({ type: actionTypes.MERGE_SETTINGS_SYNC_META, payload: { lastSyncedAt: 1 } });
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  resetSyncRegistry();
});
afterEach(() => jest.useRealTimers());

it("keeps an edit queued while a reconcile is in flight", async () => {
  const { store, feature } = setup();
  const answer = deferred();
  mockSyncSettings.mockReturnValue(answer.promise);

  let done;
  act(() => {
    done = feature.reconcile();
  });
  // The user changes a setting while the request is out.
  act(() => {
    store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "LARGE" });
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  expect(settingsOps(store)).toHaveLength(1);

  await act(async () => {
    answer.resolve({ ok: true, data: { settings: {}, syncedAt: 1 } });
    await done;
  });
  expect(settingsOps(store)).toHaveLength(1);
});

it("sends an edit still settling with its clock instead of taking the server copy", async () => {
  const { store, feature } = setup();
  mockSyncSettings.mockImplementation(async () => ({
    ok: true,
    data: { settings: { isLarivaar: { value: false, updatedAt: 5 } }, syncedAt: 6 },
  }));

  act(() => {
    store.dispatch({ type: actionTypes.TOGGLE_LARIVAAR, value: true });
  });
  // Inside the debounce window, a reconcile runs.
  await act(() => feature.reconcile());

  const [body] = mockSyncSettings.mock.calls[0];
  expect(body.settings.map((s) => s.key)).toContain("isLarivaar");
  expect(store.getState().isLarivaar).toBe(true);
});

it("keeps a newer clock set while a PUT was in flight", async () => {
  const { store, feature } = setup();
  synced(store);
  act(() => {
    store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "LARGE" });
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  const [op] = settingsOps(store);
  const answer = deferred();
  mockPutSetting.mockReturnValue(answer.promise);

  let sent;
  act(() => {
    sent = feature.drain(op);
  });
  act(() => {
    jest.setSystemTime(Date.now() + 5000);
    store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "EXTRA_LARGE" });
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  const newer = store.getState().settingsSync.clocks.fontSize;

  await act(async () => {
    answer.resolve({ ok: true, data: { updatedAt: 9 } });
    await sent;
  });
  expect(store.getState().settingsSync.clocks.fontSize).toBe(newer);
});

it("keeps an edit made while the request is out, rather than the value it replaced", async () => {
  const { store, feature } = setup();
  const answer = deferred();
  mockSyncSettings.mockReturnValue(answer.promise);

  let done;
  act(() => {
    done = feature.reconcile();
  });
  // Edited while the request is out — still inside the debounce when it lands.
  act(() => {
    jest.setSystemTime(Date.now() + 5000);
    store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "EXTRA_LARGE" });
  });
  await act(async () => {
    answer.resolve({
      ok: true,
      data: { settings: { fontSize: { value: "SMALL", updatedAt: 5 } }, syncedAt: 6 },
    });
    await done;
  });

  expect(store.getState().fontSize).toBe("EXTRA_LARGE");
  expect(settingsOps(store).map((op) => op.key)).toContain("fontSize");
});

it("writes nothing from an answer that lands after signing out", async () => {
  const { store, feature } = setup();
  const answer = deferred();
  mockSyncSettings.mockReturnValue(answer.promise);

  let done;
  act(() => {
    done = feature.reconcile();
  });
  // A sign-out gave up waiting for the flush and purged.
  act(() => {
    store.dispatch({ type: actionTypes.CLEAR_AUTH_SESSION });
    store.dispatch({ type: actionTypes.CLEAR_USER_DATA });
  });
  await act(async () => {
    answer.resolve({
      ok: true,
      data: { settings: { fontSize: { value: "SMALL", updatedAt: 5 } }, syncedAt: 99 },
    });
    expect(await done).toBe(false);
  });

  expect(store.getState().settingsSync.lastSyncedAt).toBe(0);
  expect(store.getState().settingsSync.base).toEqual({});
});

// An edit made while the request is out merges into the op already waiting
// for that key: same id, new object. Matched by id, it was completed unsent.
it("keeps an edit merged into a waiting op while the request was out", async () => {
  const { store, feature } = setup();
  act(() => {
    store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "LARGE" });
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  const [waiting] = settingsOps(store);
  const answer = deferred();
  mockSyncSettings.mockReturnValue(answer.promise);

  let done;
  act(() => {
    done = feature.reconcile();
  });
  act(() => {
    jest.setSystemTime(Date.now() + 5000);
    store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "EXTRA_LARGE" });
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  expect(settingsOps(store).map((op) => op.id)).toEqual([waiting.id]);

  await act(async () => {
    answer.resolve({ ok: true, data: { settings: {}, syncedAt: 1 } });
    await done;
  });
  expect(settingsOps(store).map((op) => op.id)).toEqual([waiting.id]);
});

// Sign-out purges before the logout browser closes, so the session still
// names the same person when a late answer lands. The account boundary moved
// all the same, and the answer must not be written into the purged slices.
it("writes nothing from an answer that lands after a purge, still signed in", async () => {
  const { store, feature } = setup();
  const answer = deferred();
  mockSyncSettings.mockReturnValue(answer.promise);

  let done;
  act(() => {
    done = feature.reconcile();
  });
  act(() => {
    store.dispatch({ type: actionTypes.CLEAR_USER_DATA });
  });
  await act(async () => {
    answer.resolve({ ok: true, data: { settings: {}, syncedAt: 99 } });
    expect(await done).toBe(false);
  });
  expect(store.getState().settingsSync.lastSyncedAt).toBe(0);
});

it("drops an edit still settling when the account boundary moves", () => {
  const { store } = setup();
  act(() => {
    store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "LARGE" });
    store.dispatch({ type: actionTypes.CLEAR_USER_DATA });
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  expect(settingsOps(store)).toEqual([]);
  expect(store.getState().settingsSync.clocks).toEqual({});
});

it("marks a theme from the account as seeded, so its suggestions never override", async () => {
  const { store, feature } = setup();
  mockSyncSettings.mockResolvedValue({
    ok: true,
    data: { settings: { theme: { value: "Dark", updatedAt: 5 } }, syncedAt: 6 },
  });
  await act(() => feature.reconcile());
  expect(store.getState().theme).toBe("Dark");
  expect(store.getState().readerThemeSeeded.Dark).toBe(true);
});

// The app filling a default (HomeScreen seeds the bani order on a fresh
// install) is not the person choosing, and must not outrank the account.
it("does not stamp a setting filled in from nothing", () => {
  const { store } = setup();
  act(() => {
    store.dispatch({ type: actionTypes.SET_BANI_ORDER, value: { checked: true, items: [] } });
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  expect(settingsOps(store)).toEqual([]);
  expect(store.getState().settingsSync.clocks).toEqual({});
});

// Before the first bulk sync no server clock is known, so a PUT would carry
// no base and could overwrite another device's newer value unchecked.
it("sends nothing key by key until the account has been bulk-synced once", async () => {
  const { store, feature } = setup();
  act(() => {
    store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "LARGE" });
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  const [op] = settingsOps(store);
  expect(await feature.drain(op)).toBe("conflict");
  expect(mockPutSetting).not.toHaveBeenCalled();
});

it("keeps its own theme when the account's is one this device cannot show", async () => {
  const { store, feature } = setup();
  mockSyncSettings.mockResolvedValue({
    ok: true,
    data: { settings: { theme: { value: "not-fetched-yet", updatedAt: 5 } }, syncedAt: 6 },
  });
  const before = store.getState().theme;
  await act(() => feature.reconcile());
  expect(store.getState().theme).toBe(before);
});

// The app normalising a stored value (HomeScreen validating the bani order)
// is not the person reordering, and must not outrank the account's copy.
it("does not stamp a value the app normalised", () => {
  const { store } = setup();
  act(() => {
    store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "LARGE" });
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  store.dispatch({ type: actionTypes.MERGE_SETTINGS_SYNC_META, payload: { replace: {} } });
  const before = settingsOps(store).length;
  act(() => {
    asAppWrite(() => store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "SMALL" }));
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  expect(settingsOps(store)).toHaveLength(before);
  expect(store.getState().settingsSync.clocks.fontSize).toBeUndefined();
});

// Sign-out's last push must include the latest edits, not join a reconcile
// built before them.
it("runs a fresh reconcile after one already out, when asked", async () => {
  const { feature } = setup();
  const first = deferred();
  mockSyncSettings
    .mockReturnValueOnce(first.promise)
    .mockResolvedValue({ ok: true, data: { settings: {}, syncedAt: 2 } });

  let running;
  act(() => {
    running = feature.reconcile();
  });
  let fresh;
  act(() => {
    fresh = feature.reconcile({ fresh: true });
  });
  await act(async () => {
    first.resolve({ ok: true, data: { settings: {}, syncedAt: 1 } });
    await running;
    await fresh;
  });
  expect(mockSyncSettings).toHaveBeenCalledTimes(2);
});

// An expiry or a refused token mid-PUT ends the session but not the account:
// the change still belongs to it and must stay queued.
it("keeps an op whose PUT outlived the session", async () => {
  const { store, feature } = setup();
  synced(store);
  act(() => {
    store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "LARGE" });
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  const [op] = settingsOps(store);
  const answer = deferred();
  mockPutSetting.mockReturnValue(answer.promise);
  let sent;
  act(() => {
    sent = feature.drain(op);
  });
  act(() => {
    store.dispatch({ type: actionTypes.CLEAR_AUTH_SESSION });
  });
  await act(async () => {
    answer.resolve({ ok: false, status: 0, error: "timeout" });
    expect(await sent).toBe("retry");
  });
});

it("drops an op whose request faulted in itself rather than retry it forever", async () => {
  const { store, feature } = setup();
  synced(store);
  act(() => {
    store.dispatch({ type: actionTypes.SET_FONT_SIZE, value: "LARGE" });
    jest.advanceTimersByTime(ENQUEUE_DEBOUNCE_MS);
  });
  const [op] = settingsOps(store);
  mockPutSetting.mockResolvedValue({ ok: false, status: 0, error: "failed" });
  expect(await feature.drain(op)).toBe("fatal");
});
