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
const setUserProfile = (value) => ({ type: actionTypes.SET_USER_PROFILE, value });
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

  it("clears a pending busy flag, so a spinner cannot outlive the sign-in", () => {
    let state = rootReducer(undefined, setAuthBusy(true));
    expect(state.auth.busy).toBe(true);
    state = rootReducer(state, setAuthSession({ user: USER, expiresAt: 1 }));
    expect(state.auth.busy).toBe(false);
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
  it("clears busy as well", () => {
    let state = rootReducer(undefined, setAuthBusy(true));
    state = rootReducer(state, clearAuthSession());
    expect(state.auth.busy).toBe(false);
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

describe("auth is kept separate from userProfile", () => {
  // userProfile.name is written by the device-keyed cloud restore. If the two
  // were merged, a stale snapshot could overwrite the signed-in user's real
  // name — so signing in must not touch userProfile at all.
  it("signing in does not write to userProfile", () => {
    const before = initial().userProfile;
    const state = rootReducer(undefined, setAuthSession({ user: USER, expiresAt: Date.now() }));
    expect(state.userProfile).toEqual(before);
  });

  it("a userProfile update does not touch the auth session", () => {
    const signedIn = rootReducer(undefined, setAuthSession({ user: USER, expiresAt: Date.now() }));
    const state = rootReducer(signedIn, setUserProfile({ name: "From Cloud Restore" }));
    expect(state.auth.user).toEqual(USER);
    expect(state.userProfile.name).toBe("From Cloud Restore");
  });
});

/**
 * CLEAR_USER_DATA is what actually fixes "sign out as A, sign in as B, still see
 * A's dashboard". The two halves matter equally: person-scoped state must go,
 * and device-scoped state must NOT — wiping downloadRegistry would orphan real
 * audio files on disk, and wiping display preferences would reset the phone's
 * setup for no reason.
 */
describe("CLEAR_USER_DATA", () => {
  // A state carrying A's data plus non-default device preferences.
  const populated = () => {
    let s = rootReducer(undefined, { type: "@@INIT" });
    s = rootReducer(s, setUserProfile({ name: "Account A" }));
    s = rootReducer(s, {
      type: actionTypes.SET_DASHBOARD_LAYOUT,
      value: { order: ["streak"], hidden: ["explore"] },
    });
    // WHICH banis are in the nitnem belongs to the pothi now, so the slice's own
    // user data is the per-day completion map.
    s = rootReducer(s, {
      type: actionTypes.TOGGLE_NITNEM_DONE,
      payload: { date: "2026-08-13", baniId: 2 },
    });
    s = rootReducer(s, { type: actionTypes.SET_BOOKMARK_POSITION, value: 1234 });
    // A folder the user made. Wire shape, mirroring pothi/model createPothi.
    s = rootReducer(s, {
      type: actionTypes.CREATE_POTHI,
      value: {
        id: "p_account_a",
        name: "A pothi",
        source: "mypothi",
        items: [],
        createdAt: 1,
        updatedAt: 1,
        isPublic: false,
        pinned: false,
      },
    });
    s = rootReducer(s, { type: actionTypes.TOGGLE_REMINDERS, value: true });
    // Device-scoped, must survive.
    s = rootReducer(s, {
      type: actionTypes.ADD_DOWNLOAD_ENTRY,
      payload: { relativePath: "artist/bani-1.m4a", baniId: 1 },
    });
    s = rootReducer(s, { type: actionTypes.SET_FONT_SIZE, value: "LARGE" });
    s = rootReducer(s, { type: actionTypes.SET_LANGUAGE, value: "pa" });
    return s;
  };

  it("resets the person-scoped slices to their defaults", () => {
    const before = populated();
    expect(before.userProfile.name).toBe("Account A");
    expect(before.todaysNitnem.completed["2026-08-13"]).toEqual([2]);

    const after = rootReducer(before, clearUserData());
    const fresh = rootReducer(undefined, { type: "@@INIT" });

    expect(after.userProfile).toEqual(fresh.userProfile);
    expect(after.dashboardLayout).toEqual(fresh.dashboardLayout);
    expect(after.todaysNitnem).toEqual(fresh.todaysNitnem);
    expect(after.bookmarkPosition).toEqual(fresh.bookmarkPosition);
    expect(after.bookmarkSequenceString).toEqual(fresh.bookmarkSequenceString);
    expect(after.isReminders).toEqual(fresh.isReminders);
    expect(after.reminderBanis).toEqual(fresh.reminderBanis);
    expect(after.reminderSound).toEqual(fresh.reminderSound);
    expect(after.pothis).toEqual(fresh.pothis);
  });

  // My Pothi was added AFTER this list existed and was never opted into it, so
  // account A's folders survived the switch — and usePothiSync then uploaded
  // them into account B on its first push. A leak, not merely stale state.
  it("resets the pothis, so one account's folders cannot follow into another", () => {
    const before = populated();
    expect(before.pothis.folders).toHaveLength(1);
    expect(before.pothis.folders[0].name).toBe("A pothi");

    const after = rootReducer(before, clearUserData());
    expect(after.pothis.folders).toEqual([]);
    // Tombstones are account-scoped too: A's deletions must not suppress a
    // folder of B's that happens to share an id.
    expect(after.pothis.deletedIds).toEqual([]);
    expect(after.pothis).toEqual(initial().pothis);
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
    expect(after.baniFontFace).toEqual(before.baniFontFace);
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
