/* eslint-env jest */
/**
 * Account-boundary logic: which sign-ins count as "a different person is now
 * using this device", and what gets wiped when one does.
 *
 * The false-positive direction matters as much as the false-negative one. Too
 * eager and a user loses their own history for re-logging in after an expiry;
 * too lax and the next account inherits the previous one's reading history.
 *
 * The collaborators are mocked rather than globally stubbed: accountScope pulls
 * in analytics SQLite, the actions barrel (→ firebase) and notifications
 * (→ localization, a native module), none of which this logic depends on.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DASHBOARD_ACCOUNT_TODAY_KEY,
  DASHBOARD_ACTIVITY_PUSHED_AT_KEY,
  DASHBOARD_RESTORED_KEY,
  DASHBOARD_LAST_PUSH_KEY,
  RESTORED_TOP_BANIS_KEY,
} from "../../services/dashboard/syncKeys";
import {
  isAccountChange,
  purgeLocalUserData,
  applyAccountScope,
  destroyLocalAccountData,
  leaveLocalAccount,
  switchAnalyticsAccount,
  readLastAccount,
  writeLastAccount,
} from "./accountScope";

const mockClearAllAnalyticsData = jest.fn(() => Promise.resolve());
const mockUseAnalyticsAccount = jest.fn(() => Promise.resolve(true));
const mockGetAllDailyActivity = jest.fn(() => Promise.resolve([]));
const mockGetAllReadSessions = jest.fn(() => Promise.resolve([]));
const mockGetAllAudioSessions = jest.fn(() => Promise.resolve([]));
const mockGetAllBaniReadCounts = jest.fn(() => Promise.resolve([]));
const mockInsertReadSession = jest.fn(() => Promise.resolve());
const mockInsertAudioSession = jest.fn(() => Promise.resolve());
const mockIncrementBaniReadCount = jest.fn(() => Promise.resolve());
const mockUpsertDailyActivity = jest.fn(() => Promise.resolve());
const mockCancelAllReminders = jest.fn(() => Promise.resolve());

jest.mock("../../database/analytics", () => ({
  // Pinned to the anonymous store, which is the state every path here is about:
  // a launch, and a sign-in after a real sign-out, both start there. What
  // happens when it is NOT anonymous — the carry guard — needs the real
  // `accountDb` key machine to mean anything, so it lives in
  // accountCarryGuard.test.js rather than being faked here.
  currentAccountKey: () => "anon",
  ANONYMOUS_KEY: "anon",
  clearAllAnalyticsData: (...a) => mockClearAllAnalyticsData(...a),
  useAnalyticsAccount: (...a) => mockUseAnalyticsAccount(...a),
  getAllDailyActivity: (...a) => mockGetAllDailyActivity(...a),
  getAllReadSessions: (...a) => mockGetAllReadSessions(...a),
  getAllAudioSessions: (...a) => mockGetAllAudioSessions(...a),
  getAllBaniReadCounts: (...a) => mockGetAllBaniReadCounts(...a),
  upsertDailyActivity: (...a) => mockUpsertDailyActivity(...a),
  insertReadSession: (...a) => mockInsertReadSession(...a),
  insertAudioSession: (...a) => mockInsertAudioSession(...a),
  incrementBaniReadCount: (...a) => mockIncrementBaniReadCount(...a),
}));
jest.mock("../actions", () => ({
  clearUserData: () => ({ type: "CLEAR_USER_DATA" }),
}));
jest.mock("../notifications", () => ({
  cancelAllReminders: (...a) => mockCancelAllReminders(...a),
}));
jest.mock("../firebase/crashlytics", () => ({ logError: jest.fn() }));

// Flipped per-test to exercise both sides of the interim switch.
//
// Read through a getter rather than captured directly: jest.mock factories are
// hoisted above every `const` in this file, so a captured object would still be
// in its temporal dead zone when accountScope imports the module. The getter
// resolves at call time, by which point the value is set.
jest.mock("../constant", () => ({
  __esModule: true,
  default: {
    get SSO_ACCOUNT_SCOPED_SYNC() {
      return global.ssoAccountScopedSyncFlag;
    },
    SSO_KEYCHAIN_SERVICE: "khalis_sso",
  },
}));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  global.ssoAccountScopedSyncFlag = false;
});

describe("isAccountChange", () => {
  it("is false for the same account (re-login after an expiry must not purge)", () => {
    expect(isAccountChange("a@khalis.net", "a@khalis.net")).toBe(false);
  });

  it("is true when a different account signs in", () => {
    expect(isAccountChange("b@khalis.net", "a@khalis.net")).toBe(true);
  });

  it("is true on first sign-in when the device has no owner yet", () => {
    expect(isAccountChange("a@khalis.net", null)).toBe(true);
  });

  it("is true on sign-out from an account", () => {
    expect(isAccountChange(null, "a@khalis.net")).toBe(true);
  });

  // Every launch of a never-signed-in app takes this path. Returning true would
  // purge a signed-out user's data on every cold start.
  it("is FALSE when signed out and there was never an account", () => {
    expect(isAccountChange(null, null)).toBe(false);
    expect(isAccountChange(undefined, null)).toBe(false);
    expect(isAccountChange("", null)).toBe(false);
  });

  // The SSO may return a differently-cased address than the one stored;
  // treating those as different accounts would purge for nothing.
  it("ignores case and surrounding whitespace", () => {
    expect(isAccountChange("A@Khalis.NET", "a@khalis.net")).toBe(false);
    expect(isAccountChange("  a@khalis.net  ", "a@khalis.net")).toBe(false);
  });

  it("treats non-string input as no account", () => {
    expect(isAccountChange(123, null)).toBe(false);
    expect(isAccountChange(null, 123)).toBe(false);
  });
});

describe("purgeLocalUserData", () => {
  const dispatch = jest.fn();

  // The history is SCOPED per account now, not deleted. Deleting it is what
  // let a device holding three seconds of reading push over a real account:
  // sign out wiped local, a few minutes of signed-out reading refilled it, and
  // the sync layer treated that as the account's truth.
  it("does NOT delete analytics history — it is scoped per account instead", async () => {
    await purgeLocalUserData(dispatch);
    expect(mockClearAllAnalyticsData).not.toHaveBeenCalled();
  });

  it("dispatches CLEAR_USER_DATA", async () => {
    await purgeLocalUserData(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
  });

  // Redux forgetting the reminders does not stop the OS firing them, so the
  // next person would be woken for the previous one's nitnem.
  it("cancels the reminders already scheduled with the OS", async () => {
    await purgeLocalUserData(dispatch);
    expect(mockCancelAllReminders).toHaveBeenCalledTimes(1);
  });

  it("still purges when cancelling the schedule fails", async () => {
    mockCancelAllReminders.mockRejectedValueOnce(new Error("notifee"));
    await expect(purgeLocalUserData(dispatch)).resolves.toBeUndefined();
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
  });

  // Every process starts on the signed-out store, so an account ended in a
  // fresh process never "left" a file, and its upload watermark survived into
  // the next account — whose older unpushed days were then never sent.
  it("clears the previous account's upload watermark and today figure", async () => {
    await AsyncStorage.setItem(DASHBOARD_ACTIVITY_PUSHED_AT_KEY, "999");
    await AsyncStorage.setItem(DASHBOARD_ACCOUNT_TODAY_KEY, "{}");
    await purgeLocalUserData(dispatch);
    expect(await AsyncStorage.getItem(DASHBOARD_ACTIVITY_PUSHED_AT_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(DASHBOARD_ACCOUNT_TODAY_KEY)).toBeNull();
  });

  it("clears the push timestamp and the restored-top-banis cache", async () => {
    await AsyncStorage.setItem(DASHBOARD_LAST_PUSH_KEY, "123");
    await AsyncStorage.setItem(RESTORED_TOP_BANIS_KEY, "{}");
    await purgeLocalUserData(dispatch);
    expect(await AsyncStorage.getItem(DASHBOARD_LAST_PUSH_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(RESTORED_TOP_BANIS_KEY)).toBeNull();
  });

  // THE interim behaviour. While the backend still keys snapshots on deviceId,
  // allowing a restore would immediately re-import the PREVIOUS account's data
  // and undo the purge. Setting the marker suppresses that.
  it("SUPPRESSES the restore while sync is still device-keyed", async () => {
    global.ssoAccountScopedSyncFlag = false;
    await purgeLocalUserData(dispatch);
    expect(await AsyncStorage.getItem(DASHBOARD_RESTORED_KEY)).toBe("1");
  });

  it("ALLOWS the restore once sync is account-keyed", async () => {
    global.ssoAccountScopedSyncFlag = true;
    await AsyncStorage.setItem(DASHBOARD_RESTORED_KEY, "1");
    await purgeLocalUserData(dispatch);
    expect(await AsyncStorage.getItem(DASHBOARD_RESTORED_KEY)).toBeNull();
  });
});

describe("leaveLocalAccount", () => {
  // Sign-out detaches the history; it never deletes it. Deleting is what let a
  // device holding a few minutes of reading push over a real account.
  it("detaches the history, purges the preferences and forgets the owner", async () => {
    const dispatch = jest.fn();
    await writeLastAccount("a@khalis.net");
    await AsyncStorage.setItem(DASHBOARD_ACCOUNT_TODAY_KEY, "{}");
    await leaveLocalAccount(dispatch);
    // Read by the streak engine as today's activity; signed out there is none.
    expect(await AsyncStorage.getItem(DASHBOARD_ACCOUNT_TODAY_KEY)).toBeNull();
    expect(mockUseAnalyticsAccount).toHaveBeenCalledWith(null);
    expect(mockClearAllAnalyticsData).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
    expect(await readLastAccount()).toBeNull();
  });

  it("switches the database before the preferences are reset", async () => {
    const order = [];
    mockUseAnalyticsAccount.mockImplementationOnce(async () => {
      order.push("detach");
      return true;
    });
    await leaveLocalAccount(() => order.push("purge"));
    expect(order).toEqual(["detach", "purge"]);
  });
});

// An expiry found at launch detaches with no purge, in a process that is
// already on the signed-out store — so "leaving a file" never happened.
it("drops the account's today figure on a bare detach", async () => {
  await AsyncStorage.setItem(DASHBOARD_ACCOUNT_TODAY_KEY, "{}");
  await switchAnalyticsAccount(null);
  expect(await AsyncStorage.getItem(DASHBOARD_ACCOUNT_TODAY_KEY)).toBeNull();
});

describe("destroyLocalAccountData", () => {
  it("purges and forgets the owner, so the next sign-in is a first one", async () => {
    const dispatch = jest.fn();
    await writeLastAccount("a@khalis.net");
    await destroyLocalAccountData(dispatch, "a@khalis.net");
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
    expect(await readLastAccount()).toBeNull();
  });

  // By the time it runs the session has ended, and ending it pointed the store
  // at the signed-out file. Emptying "whatever is open" then destroyed the
  // signed-out reading and left the deleted account's file on the phone.
  it("empties the deleted account's own file, opened by name", async () => {
    const order = [];
    mockUseAnalyticsAccount.mockImplementation(async (email) => {
      order.push(`open ${email}`);
      return true;
    });
    mockClearAllAnalyticsData.mockImplementation(async () => order.push("clear"));
    await destroyLocalAccountData(jest.fn(), "a@khalis.net");
    expect(order.slice(0, 3)).toEqual(["open a@khalis.net", "clear", "open null"]);
    mockUseAnalyticsAccount.mockImplementation(() => Promise.resolve(true));
    mockClearAllAnalyticsData.mockImplementation(() => Promise.resolve());
  });

  it("wipes nothing it cannot name", async () => {
    await destroyLocalAccountData(jest.fn());
    expect(mockClearAllAnalyticsData).not.toHaveBeenCalled();
  });
});

describe("applyAccountScope", () => {
  const dispatch = jest.fn();

  it("resets preferences and records the new owner on a real account change", async () => {
    await writeLastAccount("a@khalis.net");
    const purged = await applyAccountScope("b@khalis.net", dispatch);
    expect(purged).toBe(true);
    // Preferences reset; HISTORY is scoped, not deleted.
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
    expect(mockClearAllAnalyticsData).not.toHaveBeenCalled();
    expect(await readLastAccount()).toBe("b@khalis.net");
  });

  // The database has to follow the session even when the account did not
  // change: a relaunch starts on the anonymous store, and everything that reads
  // or writes history afterwards would otherwise hit the wrong file.
  it("points the database at the session on EVERY call, change or not", async () => {
    await writeLastAccount("a@khalis.net");
    await applyAccountScope("a@khalis.net", dispatch);
    expect(mockUseAnalyticsAccount).toHaveBeenCalledWith("a@khalis.net");
  });

  it("carries signed-out activity into the account that signs in", async () => {
    mockGetAllDailyActivity.mockResolvedValueOnce([
      { date: "2026-08-20", own_reading_seconds: 300, own_listening_seconds: 60 },
    ]);
    await applyAccountScope("a@khalis.net", dispatch);
    // ADDED as a delta: signed-out reading is genuinely extra activity for that
    // day, not a competing copy of it.
    expect(mockUpsertDailyActivity).toHaveBeenCalledWith({
      date: "2026-08-20",
      reading_seconds_delta: 300,
      listening_seconds_delta: 60,
    });
    // ...then the anonymous store is emptied COMPLETELY, so a second sign-in
    // cannot add it twice and a later sign-OUT shows a genuinely blank
    // dashboard rather than the previous account's streak and most-read lists.
    expect(mockClearAllAnalyticsData).toHaveBeenCalledTimes(1);
  });

  // A total can hold the account's sum (a restore). Carried as a delta it
  // became this device's own work and was pushed to be added again.
  it("carries this device's own seconds, never a day's totals", async () => {
    mockGetAllDailyActivity.mockResolvedValueOnce([
      {
        date: "2026-08-19",
        reading_seconds: 2400,
        listening_seconds: 0,
        own_reading_seconds: 120,
        own_listening_seconds: 0,
      },
      {
        date: "2026-08-18",
        reading_seconds: 900,
        own_reading_seconds: 0,
        own_listening_seconds: 0,
      },
    ]);
    await applyAccountScope("a@khalis.net", dispatch);
    expect(mockUpsertDailyActivity).toHaveBeenCalledTimes(1);
    expect(mockUpsertDailyActivity).toHaveBeenCalledWith({
      date: "2026-08-19",
      reading_seconds_delta: 120,
      listening_seconds_delta: 0,
    });
  });

  it("carries the session histories too, not just the day rows", async () => {
    // Carrying only `daily_activity` left the summary, the session tables and
    // the read counts behind in the pre-accounts database — so signing out
    // still showed the previous account's numbers.
    mockGetAllReadSessions.mockResolvedValueOnce([
      { bani_id: 4, bani_title: "Japji", start_time: 1, end_time: 2, duration_seconds: 300 },
    ]);
    mockGetAllAudioSessions.mockResolvedValueOnce([{ bani_id: 9, duration_played: 120 }]);
    mockGetAllBaniReadCounts.mockResolvedValueOnce([
      { bani_id: 4, bani_title: "Japji", read_count: 2 },
    ]);

    await applyAccountScope("a@khalis.net", dispatch);

    expect(mockInsertReadSession).toHaveBeenCalledTimes(1);
    expect(mockInsertAudioSession).toHaveBeenCalledTimes(1);
    // read_count 2 replays as two increments, so the count lands at 2.
    expect(mockIncrementBaniReadCount).toHaveBeenCalledTimes(2);
    expect(mockClearAllAnalyticsData).toHaveBeenCalledTimes(1);
  });

  it("leaves signed-out activity in place if adding it failed", async () => {
    mockGetAllDailyActivity.mockResolvedValueOnce([
      { date: "2026-08-20", own_reading_seconds: 300, own_listening_seconds: 0 },
    ]);
    mockUpsertDailyActivity.mockRejectedValueOnce(new Error("db locked"));
    await applyAccountScope("a@khalis.net", dispatch);
    // Nothing cleared: the rows are still there for the next attempt. Clearing
    // before a successful add would lose the reading outright.
    expect(mockClearAllAnalyticsData).not.toHaveBeenCalled();
  });

  it("does nothing when the same account signs back in", async () => {
    await writeLastAccount("a@khalis.net");
    const purged = await applyAccountScope("a@khalis.net", dispatch);
    expect(purged).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  // A first sign-in has no previous ACCOUNT to protect — only whatever this
  // person did on the device before signing in, which is their own.
  it("CLAIMS a first sign-in rather than purging it", async () => {
    expect(await readLastAccount()).toBeNull();
    const purged = await applyAccountScope("a@khalis.net", dispatch);
    expect(purged).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
    // Still records the owner, so the NEXT account is a real switch.
    expect(await readLastAccount()).toBe("a@khalis.net");
  });

  it("purges in full once a second account signs in after that", async () => {
    await applyAccountScope("a@khalis.net", dispatch);
    jest.clearAllMocks();
    const purged = await applyAccountScope("b@khalis.net", dispatch);
    expect(purged).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
    expect(await readLastAccount()).toBe("b@khalis.net");
  });

  it("does nothing on a launch that was never signed in", async () => {
    const purged = await applyAccountScope(null, dispatch);
    expect(purged).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("stores the normalised address, so case never causes a false purge", async () => {
    await applyAccountScope("A@Khalis.NET", dispatch);
    expect(await readLastAccount()).toBe("a@khalis.net");
    jest.clearAllMocks();
    expect(await applyAccountScope("a@khalis.net", dispatch)).toBe(false);
  });

  // Android delivers one sign-in twice (openAuth and the return link). Run
  // together, both read the old owner and both purged.
  it("purges once when the same sign-in arrives twice at the same moment", async () => {
    await writeLastAccount("a@khalis.net");
    const results = await Promise.all([
      applyAccountScope("b@khalis.net", dispatch),
      applyAccountScope("b@khalis.net", dispatch),
    ]);
    expect(results).toEqual([true, false]);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  // The history switch running first must not be able to skip the purge: the
  // next account would take the previous one's pothis and reminders.
  it("still purges on an account change when the history switch fails", async () => {
    mockUseAnalyticsAccount.mockRejectedValueOnce(new Error("db wedged"));
    await writeLastAccount("a@khalis.net");
    await expect(applyAccountScope("b@khalis.net", dispatch)).resolves.toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
  });

  // A failed purge must not block sign-in — the user would be stuck unable to
  // log in at all, which is worse than briefly stale data.
  it("reports false rather than throwing when the purge fails", async () => {
    await writeLastAccount("a@khalis.net");
    const failing = jest.fn(() => {
      throw new Error("store unavailable");
    });
    await expect(applyAccountScope("b@khalis.net", failing)).resolves.toBe(false);
  });
});
