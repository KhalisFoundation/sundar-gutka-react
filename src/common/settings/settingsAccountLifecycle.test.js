/* eslint-env jest */
import fs from "fs";
import path from "path";
import * as actionTypes from "../actions/actionTypes";
import rootReducer from "../reducer";
import { buildSyncPayload, emptySettingsSync, SYNCED_SETTING_KEYS } from "./syncModel";

// What signing in and out does to the settings, which is where they differ from
// every other synced thing.
//
// A pothi or a streak belongs to the ACCOUNT: leaving takes it with you. A
// setting is both — it is the person's preference AND the way this phone is
// currently set up. So the account keeps its copy, and the phone keeps its
// copy, and neither is emptied by the other.

const read = (file) => fs.readFileSync(path.join(__dirname, "..", "hooks", file), "utf8");
const signOutSource = () => {
  const src = read("useSsoActions.js").replace(/\r\n/g, "\n");
  const start = src.indexOf("const signOut = useCallback(");
  expect(start).toBeGreaterThan(-1);
  return src.slice(start, src.indexOf("const deleteAccount = useCallback("));
};

describe("signing out pushes before it clears", () => {
  it("syncs on the way out", () => {
    // purgeLocalUserData drops syncOutbox and settingsSync, so an edit that had
    // not been sent yet is gone the moment it runs — and afterwards there is no
    // token to send it with either. This is the last chance the change gets.
    expect(signOutSource()).toContain("syncAll()");
  });

  it("syncs BEFORE the session and the outbox are thrown away", () => {
    const body = signOutSource();
    expect(body.indexOf("syncAll()")).toBeLessThan(body.indexOf("clearAuthSession()"));
    expect(body.indexOf("syncAll()")).toBeLessThan(body.indexOf("purgeLocalUserData(dispatch)"));
  });

  it("gives up on the push rather than trapping anyone in a spinner", () => {
    // A phone with no signal must still be able to sign out.
    expect(signOutSource()).toContain("withDeadline(syncAll()");
  });
});

describe("signing out leaves the phone set up as it was", () => {
  // The settings are the user's preferences AND this device's configuration.
  // Emptying them on sign-out would put someone back to a default font size and
  // a default theme for the crime of ending a session.
  const stateWith = (over) => ({
    fontSize: "XL",
    theme: "Dark",
    baniLength: "long",
    isLarivaar: true,
    language: "pa",
    settingsSync: { clocks: { fontSize: 111 }, base: { fontSize: 100 }, lastSyncedAt: 5 },
    syncOutbox: { ops: { 1: { feature: "settings", kind: "set", key: "fontSize" } }, seq: 1 },
    ...over,
  });

  const afterSignOut = (state) => rootReducer(state, { type: actionTypes.CLEAR_USER_DATA });

  it("keeps every setting the person had chosen", () => {
    const next = afterSignOut(stateWith());

    expect(next.fontSize).toBe("XL");
    expect(next.theme).toBe("Dark");
    expect(next.baniLength).toBe("long");
    expect(next.isLarivaar).toBe(true);
    expect(next.language).toBe("pa");
  });

  it("does drop the clocks and the queue, which belong to the account", () => {
    // These are the only settings-related things that must not cross to the
    // next account: one person's pending edits are not another's.
    const next = afterSignOut(stateWith());

    expect(next.settingsSync).toEqual(emptySettingsSync());
    expect(next.syncOutbox).toEqual({ ops: {}, seq: 0 });
  });

  it("holds for every synced key, not just the ones spelled out above", () => {
    // A key added to SYNCED_SETTINGS later must not quietly start being wiped.
    const before = {};
    SYNCED_SETTING_KEYS.forEach((key) => {
      before[key] = `value-for-${key}`;
    });

    const next = afterSignOut({ ...before, settingsSync: emptySettingsSync() });

    SYNCED_SETTING_KEYS.forEach((key) => {
      expect(next[key]).toBe(`value-for-${key}`);
    });
  });
});

describe("signing in carries this device's own changes up", () => {
  it("sends a setting changed while signed out", () => {
    // The clock is recorded whether or not anyone is signed in, so a change
    // made before signing in is this person's and reaches the account they
    // sign into — rather than being silently replaced by the server's copy.
    const payload = buildSyncPayload({
      snapshot: { fontSize: "XL", theme: "Dark" },
      meta: { clocks: { fontSize: 900 }, base: {}, lastSyncedAt: 0 },
    });

    expect(payload.settings).toEqual([{ key: "fontSize", value: "XL", updatedAt: 900 }]);
  });

  it("sends nothing when the device changed nothing", () => {
    // Otherwise a fresh install would push its defaults over an account that
    // already has real preferences on it.
    const payload = buildSyncPayload({
      snapshot: { fontSize: "S", theme: "Default" },
      meta: emptySettingsSync(),
    });

    expect(payload.settings).toEqual([]);
  });

  it("sends every changed key together, each with its own clock", () => {
    // Per-key clocks are the whole point: two devices changing two different
    // settings both win, and one sign-in carries all of this device's.
    const payload = buildSyncPayload({
      snapshot: { fontSize: "XL", theme: "Dark", isLarivaar: true },
      meta: { clocks: { fontSize: 900, theme: 950 }, base: {}, lastSyncedAt: 0 },
    });

    expect(payload.settings).toEqual([
      { key: "fontSize", value: "XL", updatedAt: 900 },
      { key: "theme", value: "Dark", updatedAt: 950 },
    ]);
  });
});
