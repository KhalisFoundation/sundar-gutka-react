/* eslint-env jest */
/**
 * The refresh pull — the half of sync that did not exist before.
 *
 * Restore used to be a one-time bootstrap: it overwrote local state wholesale
 * and then never ran again. That is correct exactly once, on a device with
 * nothing on it. Run a second time it destroys whatever the user has done
 * since, which is why it could never be repeated, which is why two devices
 * never converged.
 *
 * These tests pin the two properties that make a repeat pull safe:
 *   1. it is MONOTONIC — no counter, day row or completion may move backwards;
 *   2. it is NARROW — a background refresh does not rewrite preferences or
 *      re-arm OS notifications.
 */

import * as analytics from "../../database/analytics";
import {
  getDashboardSnapshot,
  applyDashboardRestore,
  seedAnalyticsFromSnapshot,
  isEmptySnapshot,
} from "./dashboardSync";

const mockUpdateReminders = jest.fn();
const mockReadToken = jest.fn(async () => "test.jwt.token");
jest.mock("../../common/sso/tokenStore", () => ({
  readToken: (...a) => mockReadToken(...a),
}));

jest.mock("@common", () => ({
  constant: {
    DASHBOARD_API_BASE_URL: "http://api.test",
    DASHBOARD_LATEST_API_URL: "http://api.test/dashboard/latest",
    DASHBOARD_SYNC_API_URL: "http://api.test/dashboard/cache",
  },
  logError: jest.fn(),
  STRINGS: { time_for: "Time for" },
  updateReminders: (...a) => mockUpdateReminders(...a),
  actions: {
    setUserProfile: (value) => ({ type: "SET_USER_PROFILE", value }),
    setDashboardLayout: (value) => ({ type: "SET_DASHBOARD_LAYOUT", value }),
    restoreNitnem: (value) => ({ type: "RESTORE_NITNEM", value }),
    setReminderBanis: (value) => ({ type: "SET_REMINDER_BANIS", value }),
    toggleReminders: (value) => ({ type: "TOGGLE_REMINDERS", value }),
    setReminderSound: (value) => ({ type: "SET_REMINDER_SOUND", value }),
  },
}));

jest.mock("@database", () => ({ getBaniList: jest.fn(async () => []) }));

// A module mock rather than spyOn: these are transpiled ESM getters, so a
// second spyOn on the same export in a later test throws "cannot redefine".
jest.mock("../../database/analytics", () => ({
  getDayActivity: jest.fn(async () => null),
  setDailyActivity: jest.fn(async () => {}),
  getOrCreateSummary: jest.fn(async () => null),
  updateSummary: jest.fn(async () => {}),
  raiseAllTimeBaseline: jest.fn(async () => ({})),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockReadToken.mockResolvedValue("test.jwt.token");
});

// ── getDashboardSnapshot: the four outcomes must stay distinguishable ───────
//
// getDashboardLatest collapses "this account has no snapshot" and "the request
// failed" into the same null/throw. That is the whole reason a flaky connection
// during sign-in could leave the restore marker unwritten and gate every push
// for the rest of the session.
describe("getDashboardSnapshot", () => {
  it("reports a real snapshot, and hands back the server's syncedAt", async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ syncedAt: "2026-08-18T09:00:00.000Z", payload: { streaks: {} } }),
    }));
    const res = await getDashboardSnapshot();
    expect(res.status).toBe("ok");
    expect(res.syncedAt).toBe("2026-08-18T09:00:00.000Z");
    expect(res.payload).toEqual({ streaks: {} });
  });

  it("distinguishes an authoritative 'never synced' (404) from a failure", async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 404 }));
    expect((await getDashboardSnapshot()).status).toBe("empty");
  });

  it("treats 401 as 'not signed in', not as a failure", async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 401 }));
    expect((await getDashboardSnapshot()).status).toBe("unauthorized");
  });

  it("reports no token as unauthorized without reaching the network", async () => {
    mockReadToken.mockResolvedValue(null);
    global.fetch = jest.fn();
    expect((await getDashboardSnapshot()).status).toBe("unauthorized");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("reports a network error as failed rather than throwing", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("Network request failed");
    });
    expect((await getDashboardSnapshot()).status).toBe("failed");
  });

  it("reports a 5xx as failed — the account's state is unknown, not empty", async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 500 }));
    expect((await getDashboardSnapshot()).status).toBe("failed");
  });
});

// ── seedAnalyticsFromSnapshot: monotonic in merge mode ─────────────────────
describe("seedAnalyticsFromSnapshot in merge mode", () => {
  const payload = {
    month: { key: "2026-08", days: [[18, 200, 50]] },
    streaks: { current: 3, longest: 4 },
    totals: {
      daysActive: 10,
      readingSeconds: 1000,
      listeningSeconds: 100,
      audioSessions: 2,
      banisCompleted: 5,
    },
  };

  it("overwrites the day when NOT merging — a bootstrap has nothing to protect", async () => {
    analytics.setDailyActivity.mockResolvedValue(undefined);
    analytics.getOrCreateSummary.mockResolvedValue(null);
    analytics.updateSummary.mockResolvedValue(undefined);
    const getDay = analytics.getDayActivity;

    await seedAnalyticsFromSnapshot(payload);

    expect(getDay).not.toHaveBeenCalled();
    expect(analytics.setDailyActivity).toHaveBeenCalledWith({
      date: "2026-08-18",
      reading_seconds: 200,
      listening_seconds: 50,
      // The account's numbers, not this device's work — so the activity push
      // never files them under this device and the account cannot double.
      updatedAt: 0,
    });
  });

  it("keeps the LOCAL day total when it is higher — a pull must not erase reading", async () => {
    // The scenario: this phone read 300s today and has not pushed yet. The
    // snapshot was written by the tablet, which knows only its own 200s.
    analytics.getDayActivity.mockResolvedValue({
      reading_seconds: 300,
      listening_seconds: 10,
      updated_at: 1755600000,
    });
    analytics.setDailyActivity.mockResolvedValue(undefined);
    analytics.getOrCreateSummary.mockResolvedValue(null);
    analytics.updateSummary.mockResolvedValue(undefined);

    await seedAnalyticsFromSnapshot(payload, { merge: true });

    expect(analytics.setDailyActivity).toHaveBeenCalledWith({
      date: "2026-08-18",
      reading_seconds: 300, // local wins
      listening_seconds: 50, // remote wins
      // The row keeps the stamp it had: those 300 seconds are this device's
      // own and still have to reach the account.
      updatedAt: 1755600000,
    });
  });

  it("still takes the remote day when this device has no row for it", async () => {
    analytics.getDayActivity.mockResolvedValue(null);
    analytics.setDailyActivity.mockResolvedValue(undefined);
    analytics.getOrCreateSummary.mockResolvedValue(null);
    analytics.updateSummary.mockResolvedValue(undefined);

    await seedAnalyticsFromSnapshot(payload, { merge: true });

    expect(analytics.setDailyActivity).toHaveBeenCalledWith({
      date: "2026-08-18",
      reading_seconds: 200,
      listening_seconds: 50,
      // Never recorded here, so it is the account's day and starts unpushable.
      updatedAt: 0,
    });
  });

  it("floors the summary-only counters at what this device already holds", async () => {
    analytics.getDayActivity.mockResolvedValue(null);
    analytics.setDailyActivity.mockResolvedValue(undefined);
    analytics.getOrCreateSummary.mockResolvedValue({
      current_streak: 9,
      longest_streak: 2,
      total_days_active: 30,
      last_active_date: "2026-08-18",
    });
    const update = analytics.updateSummary;
    analytics.updateSummary.mockResolvedValue(undefined);

    await seedAnalyticsFromSnapshot(payload, { merge: true });

    const fields = update.mock.calls[0][0];
    // The streak is NOT among them: it is derived from the day rows by
    // computeStreaks, and flooring it here is what kept a lapsed streak alive.
    expect(fields).not.toHaveProperty("current_streak");
    expect(fields.longest_streak).toBe(4); // remote higher
    expect(fields.total_days_active).toBe(30);
  });

  it("REGRESSION: does not write the all-time totals into the summary directly", async () => {
    // Those four columns hold a FROZEN BASELINE that getAllTimeTotals adds this
    // install's live sessions to. A snapshot carries the SUM, so assigning it
    // here counted this device's own banis a second time on the next read, and
    // a third on the read after — the count that climbed by one on every
    // pull-to-refresh. See raiseAllTimeBaseline.
    analytics.getDayActivity.mockResolvedValue(null);
    analytics.setDailyActivity.mockResolvedValue(undefined);
    analytics.getOrCreateSummary.mockResolvedValue({ total_banis_read: 1 });
    analytics.updateSummary.mockResolvedValue(undefined);

    await seedAnalyticsFromSnapshot(payload, { merge: true });

    const written = analytics.updateSummary.mock.calls.flatMap((c) => Object.keys(c[0]));
    expect(written).not.toContain("total_banis_read");
    expect(written).not.toContain("total_reading_seconds");
    expect(written).not.toContain("total_listening_seconds");
    expect(written).not.toContain("total_audio_sessions");
    // They go through the solve-for-the-baseline path instead.
    expect(analytics.raiseAllTimeBaseline).toHaveBeenCalledWith(payload.totals);
  });

  it("raises the baseline only AFTER the day rows are merged in", async () => {
    // readingSeconds is floored against daily_activity, so the solve has to see
    // the merged days or it would compute against a stale floor.
    const order = [];
    analytics.getDayActivity.mockResolvedValue(null);
    analytics.setDailyActivity.mockImplementation(async () => {
      order.push("days");
    });
    analytics.getOrCreateSummary.mockResolvedValue(null);
    analytics.updateSummary.mockResolvedValue(undefined);
    analytics.raiseAllTimeBaseline.mockImplementation(async () => {
      order.push("baseline");
      return {};
    });

    await seedAnalyticsFromSnapshot(payload, { merge: true });

    expect(order[0]).toBe("days");
    expect(order[order.length - 1]).toBe("baseline");
  });

  it("a BOOTSTRAP still takes the snapshot's totals wholesale", async () => {
    // Local was just purged, so the live half is zero and the snapshot is the
    // whole truth — and unlike the merge it must be able to move numbers DOWN,
    // to a different account's smaller history.
    analytics.getDayActivity.mockResolvedValue(null);
    analytics.setDailyActivity.mockResolvedValue(undefined);
    analytics.getOrCreateSummary.mockResolvedValue(null);
    analytics.updateSummary.mockResolvedValue(undefined);

    await seedAnalyticsFromSnapshot(payload);

    const fields = analytics.updateSummary.mock.calls[0][0];
    expect(fields.total_banis_read).toBe(5);
    expect(fields.total_reading_seconds).toBe(1000);
    expect(analytics.raiseAllTimeBaseline).not.toHaveBeenCalled();
  });

  it("never drags last_active_date backwards — the streak engine reads a gap as a break", async () => {
    analytics.getDayActivity.mockResolvedValue(null);
    analytics.setDailyActivity.mockResolvedValue(undefined);
    analytics.getOrCreateSummary.mockResolvedValue({
      last_active_date: "2026-08-25",
    });
    const update = analytics.updateSummary;
    analytics.updateSummary.mockResolvedValue(undefined);

    await seedAnalyticsFromSnapshot(payload, { merge: true });

    expect(update.mock.calls[0][0].last_active_date).toBe("2026-08-25");
  });
});

// ── applyDashboardRestore: a refresh is narrow ─────────────────────────────
describe("applyDashboardRestore in merge mode", () => {
  const full = {
    profile: { name: "Someone" },
    layout: { order: ["a"], hidden: [] },
    nitnem: { completed: { "2026-08-18": [1, 2] } },
    reminders: { enabled: true, sound: "bell", items: [{ baaniId: 1, time: "05:00" }] },
  };

  it("touches completion history and nothing else", async () => {
    const dispatch = jest.fn();
    const applied = await applyDashboardRestore(full, dispatch, { merge: true });

    expect(applied).toEqual(["nitnem"]);
    const types = dispatch.mock.calls.map(([a]) => a.type);
    expect(types).toEqual(["RESTORE_NITNEM"]);
    expect(types).not.toContain("SET_USER_PROFILE");
    expect(types).not.toContain("SET_DASHBOARD_LAYOUT");
    expect(types).not.toContain("TOGGLE_REMINDERS");
  });

  it("hands the completion block straight to RESTORE_NITNEM, which unions it per date", async () => {
    const dispatch = jest.fn();
    await applyDashboardRestore(full, dispatch, { merge: true });
    expect(dispatch.mock.calls[0][0].value).toEqual({
      completed: { "2026-08-18": [1, 2] },
    });
  });

  it("never re-arms OS notifications on a background refresh", async () => {
    await applyDashboardRestore(full, jest.fn(), { merge: true, reschedule: true });
    expect(mockUpdateReminders).not.toHaveBeenCalled();
  });

  it("still applies everything on a bootstrap (reminders sync on their own)", async () => {
    const applied = await applyDashboardRestore(full, jest.fn(), {});
    expect(applied).toEqual(["profile", "layout", "nitnem"]);
  });
});

// ── Preferences on a refresh ───────────────────────────────────────────────
// The section order is account data: rearrange the dashboard on one phone and
// the other should follow. It used to apply only at first sign-in, so a
// customised layout never travelled again — reported as "customize layout is
// not syncing".
describe("applyDashboardRestore with preferences", () => {
  const full = {
    profile: { name: "Someone" },
    layout: { order: ["streak", "nitnem"], hidden: ["vaak"] },
    nitnem: { completed: { "2026-08-19": [1] } },
    reminders: { enabled: true, sound: "bell", items: [{ baaniId: 1, time: "05:00" }] },
  };

  it("brings the layout down when the caller says the remote copy is newer", async () => {
    const dispatch = jest.fn();
    const applied = await applyDashboardRestore(full, dispatch, {
      merge: true,
      preferences: true,
    });
    expect(applied).toContain("layout");
    const layout = dispatch.mock.calls.find(([a]) => a.type === "SET_DASHBOARD_LAYOUT");
    expect(layout[0].value).toEqual({
      order: ["streak", "nitnem"],
      hidden: ["vaak"],
      modifiedAt: expect.any(Number),
    });
  });

  // Per-block clocks: a snapshot that says WHEN each block was edited is
  // judged block by block against this device's own edits, not by the
  // whole-snapshot guess — so a phone that only rearranged its layout cannot
  // also overwrite this phone's newer display name.
  it("takes only the blocks whose clock is newer than this device's", async () => {
    const dispatch = jest.fn();
    const stamped = {
      ...full,
      profile: { name: "Someone", modifiedAt: 100 },
      layout: { order: ["streak", "nitnem"], hidden: ["vaak"], modifiedAt: 900 },
    };
    const applied = await applyDashboardRestore(stamped, dispatch, {
      merge: true,
      preferences: false,
      local: { profileModifiedAt: 500, layoutModifiedAt: 500 },
    });
    expect(applied).toContain("layout");
    expect(applied).not.toContain("profile");
    const layout = dispatch.mock.calls.find(([a]) => a.type === "SET_DASHBOARD_LAYOUT");
    expect(layout[0].value.modifiedAt).toBe(900);
  });

  it("an older stamped block is refused even when the caller would take preferences", async () => {
    const dispatch = jest.fn();
    const stamped = { ...full, layout: { order: ["a"], hidden: [], modifiedAt: 100 } };
    const applied = await applyDashboardRestore(stamped, dispatch, {
      merge: true,
      preferences: true,
      local: { layoutModifiedAt: 500 },
    });
    expect(applied).not.toContain("layout");
    expect(applied).toContain("profile"); // unstamped block: the caller's call
  });

  it("brings the display name down too", async () => {
    const dispatch = jest.fn();
    const applied = await applyDashboardRestore(full, dispatch, {
      merge: true,
      preferences: true,
    });
    expect(applied).toContain("profile");
  });

  it("does NOT dispatch the nitnem union twice on the preferences path", async () => {
    const dispatch = jest.fn();
    const applied = await applyDashboardRestore(full, dispatch, {
      merge: true,
      preferences: true,
    });
    const nitnemDispatches = dispatch.mock.calls.filter(([a]) => a.type === "RESTORE_NITNEM");
    expect(nitnemDispatches).toHaveLength(1);
    expect(applied.filter((x) => x === "nitnem")).toHaveLength(1);
  });

  it("still leaves preferences alone when the caller does not ask", async () => {
    const dispatch = jest.fn();
    const applied = await applyDashboardRestore(full, dispatch, { merge: true });
    expect(applied).toEqual(["nitnem"]);
  });

  it("never touches reminders or the OS schedule — they sync on their own", async () => {
    const dispatch = jest.fn();
    await applyDashboardRestore(full, dispatch, {
      merge: true,
      preferences: true,
      reschedule: true,
    });
    expect(mockUpdateReminders).not.toHaveBeenCalled();
    expect(dispatch.mock.calls.map(([a]) => a.type)).not.toContain("SET_REMINDER_BANIS");
  });
});

// ── isEmptySnapshot ────────────────────────────────────────────────────────
// The predicate the push path refuses on. It has to be exact in both
// directions: too loose and it blocks real uploads, too strict and it lets a
// post-purge snapshot through and an account loses its history.
describe("isEmptySnapshot", () => {
  it("recognises the shape local state has right after a purge", () => {
    expect(
      isEmptySnapshot({
        totals: { readingSeconds: 0, listeningSeconds: 0, banisCompleted: 0, daysActive: 0 },
        month: { key: "2026-08", days: [] },
        streaks: { current: 0, longest: 0 },
        nitnem: { completed: {} },
      })
    ).toBe(true);
  });

  it("treats a missing or null payload as empty", () => {
    expect(isEmptySnapshot(null)).toBe(true);
    expect(isEmptySnapshot({})).toBe(true);
  });

  it("is NOT empty when a single day of reading exists", () => {
    expect(
      isEmptySnapshot({
        totals: { readingSeconds: 60, listeningSeconds: 0, banisCompleted: 0, daysActive: 1 },
        month: { key: "2026-08", days: [[19, 60, 0]] },
      })
    ).toBe(false);
  });

  it("is NOT empty when only a streak survives", () => {
    expect(isEmptySnapshot({ streaks: { current: 0, longest: 9 } })).toBe(false);
  });

  it("is NOT empty when only a nitnem completion survives", () => {
    // Someone who has ticked banis but never had a timed reading session still
    // has history worth keeping.
    expect(isEmptySnapshot({ nitnem: { completed: { "2026-08-19": [1] } } })).toBe(false);
  });

  it("is NOT empty when only listening time survives", () => {
    expect(isEmptySnapshot({ totals: { listeningSeconds: 300 } })).toBe(false);
  });
});
