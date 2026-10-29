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
  DASHBOARD_RESTORED_KEY,
  DASHBOARD_LAST_PUSH_KEY,
  RESTORED_TOP_BANIS_KEY,
} from "../../services/dashboard/syncKeys";
import {
  isAccountChange,
  purgeLocalUserData,
  applyAccountScope,
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

  // Redux forgetting the reminders does not unschedule them with the OS.
  it("cancels reminders so the previous account's notifications stop firing", async () => {
    await purgeLocalUserData(dispatch);
    expect(mockCancelAllReminders).toHaveBeenCalledTimes(1);
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
      { date: "2026-08-20", reading_seconds: 300, listening_seconds: 60 },
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
      { date: "2026-08-20", reading_seconds: 300, listening_seconds: 0 },
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
    expect(mockClearAllAnalyticsData).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  // A first sign-in has no previous ACCOUNT to protect — only whatever this
  // person did on the device before signing in, which is their own. Purging
  // it destroyed a nitnem arranged while signed out, which is exactly the
  // work the signed-out editing is there to allow.
  it("CLAIMS a first sign-in rather than purging it", async () => {
    expect(await readLastAccount()).toBeNull();
    const purged = await applyAccountScope("a@khalis.net", dispatch);
    expect(purged).toBe(false);
    expect(mockClearAllAnalyticsData).not.toHaveBeenCalled();
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
    expect(mockClearAllAnalyticsData).not.toHaveBeenCalled();
  });

  it("stores the normalised address, so case never causes a false purge", async () => {
    await applyAccountScope("A@Khalis.NET", dispatch);
    expect(await readLastAccount()).toBe("a@khalis.net");
    jest.clearAllMocks();
    expect(await applyAccountScope("a@khalis.net", dispatch)).toBe(false);
  });

  // A failed purge must not block sign-in — the user would be stuck unable to
  // log in at all, which is worse than briefly stale data.
  it("reports false rather than throwing when the purge fails", async () => {
    mockUseAnalyticsAccount.mockRejectedValueOnce(new Error("db locked"));
    await writeLastAccount("a@khalis.net");
    await expect(applyAccountScope("b@khalis.net", dispatch)).resolves.toBe(false);
  });
});
