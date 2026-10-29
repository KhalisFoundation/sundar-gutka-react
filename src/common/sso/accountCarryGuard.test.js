/* eslint-env jest */
/**
 * The carry has a precondition, and this is the file that can see it.
 *
 * `switchAnalyticsAccount` moves UNCLAIMED reading — activity recorded before
 * anyone signed in — out of the anonymous store and into the account that just
 * signed in. It reads that activity from whichever database file is open at the
 * time, which is only the anonymous one if every path that ends a session
 * remembered to detach first. A token expiry did not, so a sign-in from that
 * state read the PREVIOUS ACCOUNT'S history as though it were unclaimed:
 * signing back in as the same person added every day row onto itself, and
 * signing in as anyone else copied the whole of it into their account. Both
 * then pushed to the cloud, where the lifetime totals ratchet and never come
 * back down.
 *
 * accountScope.test.js names that exact scenario — "re-login after an expiry
 * must not purge" — and passes, because it mocks `database/analytics` whole.
 * With `useAnalyticsAccount` reduced to a call recorder, "which file is open"
 * does not exist as a concept, so a precondition about it cannot be violated.
 *
 * So this file mocks the QUERIES and keeps the real `accountDb`: the actual key
 * state machine, the actual hashing, the actual "same account means the file
 * does not change" behaviour. That is the difference between a test that can
 * catch this and one that cannot, and it is the reason the two suites are
 * separate rather than merged.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as analytics from "../../database/analytics";
import { switchAnalyticsAccount } from "./accountScope";

const mockGetAllDailyActivity = jest.fn();
const mockGetAllReadSessions = jest.fn();
const mockGetAllAudioSessions = jest.fn();
const mockGetAllBaniReadCounts = jest.fn();
const mockUpsertDailyActivity = jest.fn();
const mockInsertReadSession = jest.fn();
const mockInsertAudioSession = jest.fn();
const mockIncrementBaniReadCount = jest.fn();
const mockClearAllAnalyticsData = jest.fn();

const READERS = [
  mockGetAllDailyActivity,
  mockGetAllReadSessions,
  mockGetAllAudioSessions,
  mockGetAllBaniReadCounts,
];
const WRITERS = [
  mockUpsertDailyActivity,
  mockInsertReadSession,
  mockInsertAudioSession,
  mockIncrementBaniReadCount,
  mockClearAllAnalyticsData,
];

jest.mock("../../database/analytics", () => {
  // The REAL key state machine — pure JS, no native module behind it. Every
  // query is still a mock; what is genuine is which account's file is open,
  // which is the whole subject of this file.
  //
  // The exported functions are arrow wrappers so the `mock*` names above are
  // resolved at CALL time: jest.mock factories are hoisted above the consts, so
  // capturing them here directly would read them in their temporal dead zone.
  const accountDb = jest.requireActual("../../database/analytics/accountDb");
  return {
    currentAccountKey: accountDb.currentAccountKey,
    accountKeyFor: accountDb.accountKeyFor,
    ANONYMOUS_KEY: accountDb.ANONYMOUS_KEY,
    useAnalyticsAccount: (email) => Promise.resolve(accountDb.setAccountKey(email)),
    getAllDailyActivity: (...a) => mockGetAllDailyActivity(...a),
    getAllReadSessions: (...a) => mockGetAllReadSessions(...a),
    getAllAudioSessions: (...a) => mockGetAllAudioSessions(...a),
    getAllBaniReadCounts: (...a) => mockGetAllBaniReadCounts(...a),
    upsertDailyActivity: (...a) => mockUpsertDailyActivity(...a),
    insertReadSession: (...a) => mockInsertReadSession(...a),
    insertAudioSession: (...a) => mockInsertAudioSession(...a),
    incrementBaniReadCount: (...a) => mockIncrementBaniReadCount(...a),
    clearAllAnalyticsData: (...a) => mockClearAllAnalyticsData(...a),
  };
});
jest.mock("../actions", () => ({ clearUserData: () => ({ type: "CLEAR_USER_DATA" }) }));
jest.mock("../notifications", () => ({ cancelAllReminders: jest.fn(() => Promise.resolve()) }));
jest.mock("../firebase/crashlytics", () => ({ logError: jest.fn() }));
jest.mock("../constant", () => ({
  __esModule: true,
  default: { SSO_ACCOUNT_SCOPED_SYNC: true, SSO_KEYCHAIN_SERVICE: "khalis_sso" },
}));

const A = "a@khalis.net";
const B = "b@khalis.net";

/** A day of reading sitting in whichever store is currently open. */
const oneDay = [{ date: "2026-08-20", reading_seconds: 300, listening_seconds: 60 }];

beforeEach(async () => {
  // mockReset on OUR mocks specifically, and neither of the blunt instruments.
  //
  // clearAllMocks leaves queued `mockResolvedValueOnce` values in place, which
  // bites hard in a suite about calls that must NOT happen: a value the guard
  // correctly refused to consume is answered to the next test's first read,
  // failing a later test for something an earlier one set up.
  //
  // resetAllMocks drains those queues but also strips the AsyncStorage mock's
  // own implementations, so every getItem then reads back undefined — including
  // the ones these tests assert on.
  [...READERS, ...WRITERS].forEach((m) => m.mockReset());
  READERS.forEach((m) => m.mockResolvedValue([]));
  WRITERS.forEach((m) => m.mockResolvedValue(undefined));
  await AsyncStorage.clear();
  // Every launch starts on the anonymous store; reset to that between tests
  // because the key is module state and would otherwise leak across them.
  await analytics.useAnalyticsAccount(null);
});

describe("carrying signed-out activity into an account", () => {
  it("claims the anonymous store when that is what is open", async () => {
    mockGetAllDailyActivity.mockResolvedValueOnce(oneDay);

    const carried = await switchAnalyticsAccount(A);

    // ADDED as a delta — signed-out reading is genuinely extra activity for
    // that day, not a competing copy of it.
    expect(mockUpsertDailyActivity).toHaveBeenCalledWith({
      date: "2026-08-20",
      reading_seconds_delta: 300,
      listening_seconds_delta: 60,
    });
    // ...then the anonymous store is emptied, so a second sign-in cannot add
    // the same reading twice.
    expect(mockClearAllAnalyticsData).toHaveBeenCalledTimes(1);
    expect(carried).toBe(1);
    expect(analytics.currentAccountKey()).toBe(analytics.accountKeyFor(A));
  });
});

describe("when a session ended without detaching the database", () => {
  // The state a token expiry used to leave behind: signed out, but the previous
  // account's file still open.
  const expiredButStillAttached = () => analytics.useAnalyticsAccount(A);

  it("refuses to carry an account's history into ITSELF", async () => {
    await expiredButStillAttached();
    mockGetAllDailyActivity.mockResolvedValueOnce(oneDay);

    const carried = await switchAnalyticsAccount(A);

    // `setAccountKey` returns false for an unchanged key, so no file switch
    // happens and the source and destination are one and the same. Carrying
    // here adds every day row onto itself: 300 seconds becomes 600, and every
    // read session is re-inserted, on every re-login.
    expect(carried).toBe(0);
    expect(mockUpsertDailyActivity).not.toHaveBeenCalled();
    expect(mockInsertReadSession).not.toHaveBeenCalled();
    expect(mockIncrementBaniReadCount).not.toHaveBeenCalled();
    // Not even read. The guard is ahead of the query, so the account's history
    // is never lifted out of SQLite in the first place.
    expect(mockGetAllDailyActivity).not.toHaveBeenCalled();
    // And nothing is emptied — `clearAllAnalyticsData` here would fire against
    // whichever store is open at the time.
    expect(mockClearAllAnalyticsData).not.toHaveBeenCalled();
  });

  it("refuses to carry one account's history into ANOTHER, but still switches", async () => {
    await expiredButStillAttached();
    mockGetAllDailyActivity.mockResolvedValueOnce(oneDay);
    mockGetAllReadSessions.mockResolvedValueOnce([
      { bani_id: 4, bani_title: "Japji", start_time: 1, end_time: 2, duration_seconds: 300 },
    ]);

    const carried = await switchAnalyticsAccount(B);

    expect(carried).toBe(0);
    expect(mockGetAllDailyActivity).not.toHaveBeenCalled();
    expect(mockUpsertDailyActivity).not.toHaveBeenCalled();
    expect(mockInsertReadSession).not.toHaveBeenCalled();
    // Refusing to CARRY must not mean refusing to SWITCH — B still has to end
    // up reading its own file, or it would go on writing into A's.
    expect(analytics.currentAccountKey()).toBe(analytics.accountKeyFor(B));
    expect(analytics.currentAccountKey()).not.toBe(analytics.accountKeyFor(A));
  });

  // Distinguishes this guard from the one it is easy to reach for instead.
  it("is about the SOURCE being anonymous, not about the key changing", async () => {
    await expiredButStillAttached();
    mockGetAllDailyActivity.mockResolvedValueOnce(oneDay);

    await switchAnalyticsAccount(B);

    // A "did the account change?" test would have let this through — A to B is
    // a change — and that is the variant that leaks one person's history into
    // someone else's account, which is the worse of the two.
    expect(mockUpsertDailyActivity).not.toHaveBeenCalled();
  });
});

describe("the per-account state held in GLOBAL AsyncStorage keys", () => {
  // The reported bug, end to end: read something signed out, sign in, sign out
  // again — and the blank dashboard showed a 1-day streak and a best streak
  // of 1.
  //
  // Nothing was wrong with the history. `clearAllAnalyticsData` had emptied the
  // anonymous store correctly. What survived was DASHBOARD_ACCOUNT_TODAY_KEY,
  // which records what the ACCOUNT read today across its devices, and which the
  // streak engine trusts on its own without consulting a local row — so the
  // engine counted today as active off an empty store, then floored the
  // lifetime figures at that fabricated 1 where Math.max keeps it for good.
  it("drops the previous account's keys when its store is closed", async () => {
    await AsyncStorage.multiSet([
      ["@dashboard_account_today_v1", JSON.stringify({ date: "2026-09-02", seconds: 900 })],
      ["@dashboard_activity_pushed_at_v1", "1756800000"],
      ["@dashboard_payload_hash_v1", "deadbeef"],
    ]);
    await analytics.useAnalyticsAccount(A);

    await switchAnalyticsAccount(null);

    expect(await AsyncStorage.getItem("@dashboard_account_today_v1")).toBeNull();
    expect(await AsyncStorage.getItem("@dashboard_activity_pushed_at_v1")).toBeNull();
    expect(await AsyncStorage.getItem("@dashboard_payload_hash_v1")).toBeNull();
  });

  it("drops them on a switch straight from one account to another", async () => {
    await AsyncStorage.setItem("@dashboard_activity_pushed_at_v1", "1756800000");
    await analytics.useAnalyticsAccount(A);

    await switchAnalyticsAccount(B);

    // Against B's rows A's watermark reads too high, so `getActivityUpdatedSince`
    // returns nothing and B's local history would never upload at all.
    expect(await AsyncStorage.getItem("@dashboard_activity_pushed_at_v1")).toBeNull();
  });

  it("KEEPS them on a plain relaunch, which attaches without leaving anything", async () => {
    await AsyncStorage.setItem("@dashboard_activity_pushed_at_v1", "1756800000");
    // A launch starts on the anonymous store and points at the signed-in
    // account. The key changes, but the watermark is this account's own and is
    // still correct — dropping it every launch would re-push a year of day rows.
    await switchAnalyticsAccount(A);

    expect(await AsyncStorage.getItem("@dashboard_activity_pushed_at_v1")).toBe("1756800000");
  });
});

describe("the signed-out store's summary", () => {
  // The second half of the same report: with the today-key gone the streak is
  // no longer fabricated, but one already written stayed written. The summary
  // is the only part of the store `clearAllAnalyticsData` repairs, and that
  // call sat below a `total === 0` return — so a store with no rows and a
  // summary claiming a streak had nothing that would ever put it back to zero.
  it("is zeroed on sign-out when no rows stand behind it", async () => {
    await analytics.useAnalyticsAccount(A);
    // Nothing in any of the four tables — the default from beforeEach.

    await switchAnalyticsAccount(null);

    expect(mockClearAllAnalyticsData).toHaveBeenCalledTimes(1);
  });

  it("is left alone when the store still holds unclaimed reading", async () => {
    await analytics.useAnalyticsAccount(A);
    // Rows here mean an earlier carry FAILED and left them to retry. They are
    // real activity, the summary describing them is real, and wiping either
    // would lose reading outright — the one outcome this whole module is
    // arranged to avoid.
    mockGetAllDailyActivity.mockResolvedValue(oneDay);

    await switchAnalyticsAccount(null);

    expect(mockClearAllAnalyticsData).not.toHaveBeenCalled();
  });
});

describe("once the session teardown detaches, as it now does", () => {
  it("claims reading done after an expiry for whoever signs in next", async () => {
    // Signed in as A, then the token lapses — `endSession` detaches.
    await analytics.useAnalyticsAccount(A);
    await switchAnalyticsAccount(null);
    expect(analytics.currentAccountKey()).toBe(analytics.ANONYMOUS_KEY);

    // Reading done in that signed-out window lands in the anonymous store,
    // where it belongs, instead of quietly in A's file.
    mockGetAllDailyActivity.mockResolvedValueOnce(oneDay);

    const carried = await switchAnalyticsAccount(B);

    // ...and is claimed normally. The two halves of the fix compose: detaching
    // restores the precondition, and the guard means nothing depends on it
    // having happened.
    expect(carried).toBe(1);
    expect(mockUpsertDailyActivity).toHaveBeenCalledWith({
      date: "2026-08-20",
      reading_seconds_delta: 300,
      listening_seconds_delta: 60,
    });
    expect(analytics.currentAccountKey()).toBe(analytics.accountKeyFor(B));
  });
});
