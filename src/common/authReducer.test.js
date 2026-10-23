/* eslint-env jest */
/**
 * Tests for the Khalis SSO `auth` slice.
 *
 * The default `status: "unknown"` is load-bearing, not cosmetic: the slice is
 * blacklisted from redux-persist (see store.js), so every cold start begins
 * here and the UI must be able to tell "not known yet" apart from "signed out"
 * — otherwise it flashes a signed-out state before the Keychain read resolves.
 *
 * Actions are built from `actionTypes` rather than imported from `./actions`:
 * that barrel pulls in Firebase analytics, which Jest does not transform. The
 * shapes below mirror the creators exactly (see actions/index.js).
 */

import * as actionTypes from "./actions/actionTypes";
import rootReducer from "./reducer";

const setAuthSession = (value) => ({ type: actionTypes.SET_AUTH_SESSION, value });
const clearAuthSession = () => ({ type: actionTypes.CLEAR_AUTH_SESSION });
const setAuthBusy = (value) => ({ type: actionTypes.SET_AUTH_BUSY, value });
const clearUserData = () => ({ type: actionTypes.CLEAR_USER_DATA });

const initial = () => rootReducer(undefined, { type: "@@INIT" });

const USER = {
  firstname: "Test",
  lastname: "User",
  email: "test@khalis.net",
  nameID: "test@khalis.net",
  nameIDFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
};

describe("auth slice defaults", () => {
  it("starts as 'unknown', not 'signedOut'", () => {
    expect(initial().auth.status).toBe("unknown");
  });

  it("has no user, expiry or busy flag by default", () => {
    const { auth } = initial();
    expect(auth.user).toBeNull();
    expect(auth.expiresAt).toBeNull();
    expect(auth.busy).toBe(false);
  });
});

describe("setAuthSession", () => {
  it("moves to signedIn and stores the claims + expiry", () => {
    const expiresAt = Date.now() + 60000;
    const state = rootReducer(undefined, setAuthSession({ user: USER, expiresAt }));
    expect(state.auth).toEqual({ status: "signedIn", user: USER, expiresAt, busy: false });
  });

  // Busy belongs to the action that set it. A session beginning mid-action
  // (the Android return link while startLogin still waits) clearing it
  // re-enabled the row with a login browser still open.
  it("leaves the busy flag to the action that set it", () => {
    let state = rootReducer(undefined, setAuthBusy(true));
    state = rootReducer(state, setAuthSession({ user: USER, expiresAt: 1 }));
    expect(state.auth.busy).toBe(true);
  });

  it("tolerates a missing payload rather than throwing", () => {
    const state = rootReducer(undefined, setAuthSession(undefined));
    expect(state.auth.status).toBe("signedIn");
    expect(state.auth.user).toBeNull();
    expect(state.auth.expiresAt).toBeNull();
  });
});

describe("clearAuthSession", () => {
  it("goes to signedOut and drops every trace of the session", () => {
    const signedIn = rootReducer(undefined, setAuthSession({ user: USER, expiresAt: Date.now() }));
    const state = rootReducer(signedIn, clearAuthSession());
    expect(state.auth).toEqual({
      status: "signedOut",
      user: null,
      expiresAt: null,
      busy: false,
    });
  });

  // Sign-out is reachable while a request is in flight; a stuck busy flag would
  // leave the row spinning forever.
  // A 401 ending the session during sign-out must not re-enable the row
  // while the logout browser is still open.
  it("leaves busy alone too", () => {
    let state = rootReducer(undefined, setAuthBusy(true));
    state = rootReducer(state, clearAuthSession());
    expect(state.auth.busy).toBe(true);
  });
});

describe("setAuthBusy", () => {
  it("toggles without disturbing the session", () => {
    const expiresAt = Date.now() + 60000;
    let state = rootReducer(undefined, setAuthSession({ user: USER, expiresAt }));
    state = rootReducer(state, setAuthBusy(true));
    expect(state.auth).toEqual({ status: "signedIn", user: USER, expiresAt, busy: true });
    state = rootReducer(state, setAuthBusy(false));
    expect(state.auth.busy).toBe(false);
    expect(state.auth.user).toEqual(USER);
  });

  it("coerces truthy/falsy values to a real boolean", () => {
    expect(rootReducer(undefined, setAuthBusy("yes")).auth.busy).toBe(true);
    expect(rootReducer(undefined, setAuthBusy(undefined)).auth.busy).toBe(false);
  });
});

/**
 * CLEAR_USER_DATA is what actually fixes "sign out as A, sign in as B, still
 * have A's bookmarks and reminders". The two halves matter equally: person-scoped state must go,
 * and device-scoped state must NOT — wiping downloadRegistry would orphan real
 * audio files on disk, and wiping display preferences would reset the phone's
 * setup for no reason.
 */
describe("CLEAR_USER_DATA", () => {
  // A state carrying A's data plus non-default device preferences.
  const populated = () => {
    let s = rootReducer(undefined, { type: "@@INIT" });
    s = rootReducer(s, { type: actionTypes.SET_BOOKMARK_POSITION, value: 1234 });
    s = rootReducer(s, { type: actionTypes.TOGGLE_REMINDERS, value: true });
    s = rootReducer(s, {
      type: actionTypes.MERGE_SETTINGS_SYNC_META,
      payload: { clocks: { baniOrder: 5 } },
    });
    s = rootReducer(s, {
      type: actionTypes.ENQUEUE_SYNC_OP,
      payload: { feature: "settings", kind: "put", key: "baniOrder" },
    });
    // Device-scoped, must survive.
    s = rootReducer(s, {
      type: actionTypes.ADD_DOWNLOAD_ENTRY,
      payload: { relativePath: "artist/bani-1.m4a", baniId: 1 },
    });
    s = rootReducer(s, { type: actionTypes.SET_FONT_SIZE, value: "LARGE" });
    s = rootReducer(s, { type: actionTypes.SET_LANGUAGE, value: "pa" });
    return s;
  };

  it("resets the account's sync data to its defaults", () => {
    const before = populated();
    expect(Object.keys(before.syncOutbox.ops)).toHaveLength(1);

    const after = rootReducer(before, clearUserData());
    const fresh = rootReducer(undefined, { type: "@@INIT" });

    // The outgoing account's sync clocks and unsent changes.
    expect(after.settingsSync).toEqual(fresh.settingsSync);
    expect(after.syncOutbox.ops).toEqual(fresh.syncOutbox.ops);
  });

  // No account copy of these exists yet, so dropping them on sign-out lost
  // them for good — even for the same person signing straight back in. They
  // join the purge with the PRs that sync them.
  it("keeps bookmarks and reminders, which nothing syncs yet", () => {
    const before = populated();
    const after = rootReducer(before, clearUserData());
    expect(after.bookmarkPosition).toBe(1234);
    expect(after.isReminders).toBe(true);
  });

  // An op sent before the reset can still answer after it. Ids end in the
  // sequence number, so a counter restarted at 0 handed that late answer a
  // NEW op with the same id, which it then completed unsent.
  it("keeps the outbox counting, so new ops never reuse an in-flight id", () => {
    const before = populated();
    const [oldId] = Object.keys(before.syncOutbox.ops);
    const cleared = rootReducer(before, clearUserData());
    const again = rootReducer(cleared, {
      type: actionTypes.ENQUEUE_SYNC_OP,
      payload: { feature: "settings", kind: "put", key: "baniOrder" },
    });
    expect(Object.keys(again.syncOutbox.ops)).not.toContain(oldId);
  });

  // Downloaded audio belongs to the phone, not the person. Clearing the registry
  // would leave the files on disk with nothing pointing at them.
  it("leaves downloads untouched", () => {
    const before = populated();
    const after = rootReducer(before, clearUserData());
    expect(after.downloadRegistry).toEqual(before.downloadRegistry);
    expect(after.downloadQueue).toEqual(before.downloadQueue);
    expect(after.downloadWifiOnly).toEqual(before.downloadWifiOnly);
    expect(after.autoDownloadOnStream).toEqual(before.autoDownloadOnStream);
  });

  it("leaves display preferences untouched", () => {
    const before = populated();
    const after = rootReducer(before, clearUserData());
    expect(after.fontSize).toEqual(before.fontSize);
    expect(after.language).toEqual(before.language);
    expect(after.isNightMode).toEqual(before.isNightMode);
    expect(after.fontFace).toEqual(before.fontFace);
  });

  // The purge runs while signing IN, before setAuthSession — it must not wipe
  // the session that is being established.
  it("leaves the auth slice untouched", () => {
    let s = rootReducer(undefined, setAuthSession({ user: USER, expiresAt: 123 }));
    s = rootReducer(s, clearUserData());
    expect(s.auth.status).toBe("signedIn");
    expect(s.auth.user).toEqual(USER);
  });

  it("is a no-op on undefined state (first ever action)", () => {
    expect(() => rootReducer(undefined, clearUserData())).not.toThrow();
  });
});
