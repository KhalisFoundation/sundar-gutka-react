/* eslint-env jest */
/**
 * Tests for cross-device restore (GET /dashboard/latest):
 *  - getDashboardLatest: 404 → null, 401 → null, 200 → payload, error → throws
 *  - applyDashboardRestore: dispatches the right Redux actions, converts 24h
 *    reminder times to "h:mm A", and only reschedules when asked.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as analytics from "../../database/analytics";
import {
  getDashboardLatest,
  getDashboardState,
  applyDashboardRestore,
  applyServerActivity,
  seedAnalyticsFromSnapshot,
  buildCachePayload,
} from "./dashboardSync";

const mockUpdateReminders = jest.fn();

// The endpoints are auth-only now, so every call reads the session token first.
// Default to a present token; the "signed out" case overrides it.
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

// The restore resolves each reminder's bani NAMES out of the local database —
// the server payload carries only IDs. Without this the names come back blank,
// which is what made restored reminders render with no title.
jest.mock("@database", () => ({
  getBaniList: jest.fn().mockResolvedValue([
    { id: 1, gurmukhi: "jpujI swihb", translit: "Japji Sahib" },
    { id: 2, gurmukhi: "jwpu swihb", translit: "Jaap Sahib" },
  ]),
}));

jest.mock("../../database/analytics", () => ({
  getOrCreateSummary: jest.fn(),
  getDailyActivity: jest.fn(),
  getTopReadBanis: jest.fn(),
  getTopListenedBanis: jest.fn(),
  getRecentReadBanis: jest.fn(),
  getRecentListenedBanis: jest.fn(),
  getAllTimeTotals: jest.fn(),
  getDayActivity: jest.fn(),
  setDailyActivity: jest.fn(),
  updateSummary: jest.fn(),
  raiseAllTimeBaseline: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

const samplePayload = {
  profile: { name: "Harpreet Kaur" },
  layout: { order: ["streak", "nitnem"], hidden: ["weekChart"] },
  nitnem: { selectedBaaniIds: [2, 3, 4], completed: { "2025-06-11": [2] } },
  reminders: {
    enabled: true,
    sound: "default",
    items: [
      { baaniId: 2, time: "03:30", enabled: true },
      { baaniId: 21, time: "18:00", enabled: false },
    ],
  },
};

describe("getDashboardLatest", () => {
  it("returns null on 404 (fresh account)", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 404, ok: false });
    await expect(getDashboardLatest()).resolves.toBeNull();
  });

  it("returns the payload on 200", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ status: 200, ok: true, json: async () => ({ payload: samplePayload }) });
    const payload = await getDashboardLatest();
    expect(payload.profile.name).toBe("Harpreet Kaur");
  });

  it("throws on a non-404 error status", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 500, ok: false });
    await expect(getDashboardLatest()).rejects.toThrow();
  });

  // A lapsed or absent session is a normal state, not a sync failure — the
  // caller shows local data and says nothing.
  it("returns null on 401 without throwing", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 401, ok: false });
    await expect(getDashboardLatest()).resolves.toBeNull();
  });

  it("does not even call fetch when there is no token", async () => {
    mockReadToken.mockResolvedValueOnce(null);
    global.fetch = jest.fn();
    await expect(getDashboardLatest()).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends the bearer token and no deviceId query", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ status: 200, ok: true, json: async () => ({ payload: samplePayload }) });
    await getDashboardLatest();
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://api.test/dashboard/latest");
    expect(url).not.toContain("deviceId");
    expect(opts.headers.Authorization).toBe("Bearer test.jwt.token");
  });
});

describe("applyDashboardRestore", () => {
  it("dispatches profile, layout and nitnem restores", async () => {
    const dispatch = jest.fn();
    const applied = await applyDashboardRestore(samplePayload, dispatch);

    expect(applied).toEqual(expect.arrayContaining(["profile", "layout", "nitnem"]));

    const types = dispatch.mock.calls.map((c) => c[0].type);
    expect(types).toEqual(
      expect.arrayContaining(["SET_USER_PROFILE", "SET_DASHBOARD_LAYOUT", "RESTORE_NITNEM"])
    );

    const nitnem = dispatch.mock.calls.find((c) => c[0].type === "RESTORE_NITNEM")[0].value;
    expect(nitnem.completed).toEqual({ "2025-06-11": [2] });
    // Completion history only. The bani SET is the Morning Nitnem pothi, which
    // syncs on the account through the folders API — restoring it from this
    // per-device snapshot would overwrite the account's copy.
    expect(nitnem.selectedBaniIds).toBeUndefined();
  });

  // Reminders sync as rows of their own through /reminders now (see
  // services/reminders). The snapshot still carries them for older app
  // versions, but this version must never apply them — a later snapshot from
  // one phone would otherwise replace the other phone's whole list.
  it("leaves the snapshot's reminders block alone", async () => {
    const dispatch = jest.fn();
    const applied = await applyDashboardRestore(samplePayload, dispatch, { reschedule: true });
    expect(applied).not.toContain("reminders");
    const types = dispatch.mock.calls.map((c) => c[0].type);
    expect(types).not.toContain("SET_REMINDER_BANIS");
    expect(types).not.toContain("TOGGLE_REMINDERS");
    expect(mockUpdateReminders).not.toHaveBeenCalled();
  });

  it("is a no-op for a null payload (fresh account)", async () => {
    const dispatch = jest.fn();
    const applied = await applyDashboardRestore(null, dispatch);
    expect(applied).toEqual([]);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("seedAnalyticsFromSnapshot", () => {
  it("seeds daily_activity per day (overwrite) and writes the summary, including last_active_date", async () => {
    await seedAnalyticsFromSnapshot({
      month: {
        key: "2025-06",
        days: [
          [1, 120, 0],
          [5, 0, 300],
        ],
      },
      streaks: { current: 14, longest: 31 },
      totals: {
        daysActive: 88,
        readingSeconds: 360000,
        listeningSeconds: 250000,
        audioSessions: 300,
        banisCompleted: 540,
      },
    });

    expect(analytics.setDailyActivity).toHaveBeenCalledTimes(2);
    expect(analytics.setDailyActivity).toHaveBeenCalledWith({
      date: "2025-06-01",
      reading_seconds: 120,
      listening_seconds: 0,
      // Restored from the ACCOUNT, so the activity push must never file these
      // seconds under this device — that is what doubled everyone's figures.
      updatedAt: 0,
    });
    const fields = analytics.updateSummary.mock.calls[0][0];
    expect(fields).toMatchObject({
      current_streak: 14,
      longest_streak: 31,
      total_days_active: 88,
      total_reading_seconds: 360000,
      total_listening_seconds: 250000,
      total_audio_sessions: 300,
      total_banis_read: 540,
      // Derived from the latest restored day (day 5) — without this, the
      // streak engine sees a null last_active_date and zeroes current_streak
      // right back to 0 on the very next computeStreaks() run.
      last_active_date: "2025-06-05",
    });
  });

  it("is a no-op for a null payload", async () => {
    await seedAnalyticsFromSnapshot(null);
    expect(analytics.setDailyActivity).not.toHaveBeenCalled();
    expect(analytics.updateSummary).not.toHaveBeenCalled();
  });
});

describe("buildCachePayload", () => {
  const state = {
    currentBani: { id: 4 },
    isReminders: true,
    reminderSound: "default",
    reminderBanis: JSON.stringify([
      { id: 2, time: "3:30 AM", enabled: true },
      { id: 21, time: "6:00 PM", enabled: false },
    ]),
    todaysNitnem: { completed: { "2025-06-11": [2] } },
    // The pushed Nitnem set comes from the Morning Nitnem pothi, not from a
    // list of its own — see TodaysNitnem.
    pothis: {
      folders: [
        {
          id: "m1",
          name: "Morning Nitnem",
          items: [{ baaniId: 2 }, { baaniId: 3 }, { baaniId: 4 }],
        },
      ],
      defaultIds: { morning: "m1", evening: null },
    },
    userProfile: { name: "Harpreet Kaur" },
    dashboardLayout: { order: ["streak", "nitnem"], hidden: ["weekChart"] },
  };

  beforeEach(() => {
    analytics.getOrCreateSummary.mockResolvedValue({
      current_streak: 14,
      longest_streak: 31,
      total_days_active: 88,
    });
    analytics.getDailyActivity.mockResolvedValue([
      { date: "2025-06-01", reading_seconds: 120, listening_seconds: 0 },
    ]);
    analytics.getTopReadBanis.mockResolvedValue([{ bani_id: 2, session_count: 42 }]);
    analytics.getTopListenedBanis.mockResolvedValue([{ bani_id: 1, session_count: 27 }]);
    analytics.getRecentReadBanis.mockResolvedValue([{ bani_id: 5 }]);
    analytics.getRecentListenedBanis.mockResolvedValue([{ bani_id: 1 }]);
    // Baseline (restored) + live (this install) combined — see getAllTimeTotals.
    analytics.getAllTimeTotals.mockResolvedValue({
      banisCompleted: 540,
      readingSeconds: 360000,
      listeningSeconds: 250000,
      audioSessions: 300,
    });
  });

  it("maps Redux state + analytics into the KHALIS payload (24h reminder times)", async () => {
    const body = await buildCachePayload({ state, version: "1.0.0", deviceId: "dev-1" });

    expect(body.version).toBe("1.0.0");
    expect(body.deviceId).toBe("dev-1");
    expect(body.userId).toBeNull();
    expect(typeof body.capturedAt).toBe("string");

    const p = body.payload;
    expect(p.lastVisitedBaaniId).toBe(4);
    expect(p.streaks).toEqual({ current: 14, longest: 31 });
    expect(p.month.days).toEqual([[1, 120, 0]]);
    expect(p.read.top5).toEqual([[2, 42, 0]]);
    expect(p.read.last).toEqual({ baaniId: 5 });
    expect(p.totals.banisCompleted).toBe(540);
    expect(p.nitnem.selectedBaaniIds).toEqual([2, 3, 4]);
    expect(p.profile.name).toBe("Harpreet Kaur");
    // Each preference block carries the clock of this device's last edit.
    expect(p.profile.modifiedAt).toEqual(expect.any(Number));
    expect(p.layout).toEqual({
      order: ["streak", "nitnem"],
      hidden: ["weekChart"],
      modifiedAt: expect.any(Number),
    });
    // App "h:mm A" → contract "HH:mm".
    expect(p.reminders.items).toEqual([
      { baaniId: 2, time: "03:30", enabled: true },
      { baaniId: 21, time: "18:00", enabled: false },
    ]);
  });
});

describe("getDashboardState", () => {
  // Omitting the month is what a restore does, and the endpoint reads it as
  // "every day you still hold" — `if (!month || day.startsWith(month))`. Naming
  // one narrows the day map server-side, which is how a reinstall on the 2nd
  // was served that month alone and lost the calendar it had read.
  it("asks for the WHOLE history when no month is named", async () => {
    const state = { totals: {}, streaks: {}, days: { "2026-08-31": [293, 0] } };
    global.fetch = jest.fn().mockResolvedValue({ status: 200, ok: true, json: async () => state });

    expect(await getDashboardState()).toEqual({ status: "ok", state });
    expect(global.fetch.mock.calls[0][0]).toBe("http://api.test/dashboard/state");
  });

  it("still narrows to one month when asked to", async () => {
    const state = { totals: { readingSeconds: 10 }, streaks: { current: 1, longest: 2 }, days: {} };
    global.fetch = jest.fn().mockResolvedValue({ status: 200, ok: true, json: async () => state });
    expect(await getDashboardState("2026-08")).toEqual({ status: "ok", state });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://api.test/dashboard/state?month=2026-08");
    expect(opts.headers.Authorization).toBe("Bearer test.jwt.token");
  });

  it("keeps a failure distinguishable from an empty account", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 500, ok: false });
    expect(await getDashboardState("2026-08")).toMatchObject({ status: "failed" });
    global.fetch = jest.fn().mockRejectedValue(new Error("Network request failed"));
    expect(await getDashboardState("2026-08")).toMatchObject({ status: "failed" });
    global.fetch = jest.fn().mockResolvedValue({ status: 401, ok: false });
    expect(await getDashboardState("2026-08")).toEqual({ status: "unauthorized" });
  });

  it("does not call the server without a session", async () => {
    mockReadToken.mockResolvedValueOnce(null);
    global.fetch = jest.fn();
    expect(await getDashboardState("2026-08")).toEqual({ status: "unauthorized" });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("applyServerActivity", () => {
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const dayKey = (d) => `${monthKey(d)}-${String(d.getDate()).padStart(2, "0")}`;

  // The clock is pinned so "yesterday" is a fixed, unambiguous date rather
  // than whatever the machine says when the suite runs.
  const TODAY = new Date(2026, 7, 20, 10, 0, 0);
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(TODAY);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("overwrites past days with the account's sum, marked so they are never re-pushed", async () => {
    const today = new Date(TODAY);
    const yesterday = new Date(2026, 7, 19);
    const state = {
      totals: { readingSeconds: 900, listeningSeconds: 0, daysActive: 7 },
      streaks: { current: 3, longest: 9 },
      days: { [dayKey(yesterday)]: [600, 30], [dayKey(today)]: [120, 0] },
    };
    analytics.getOrCreateSummary.mockResolvedValue({ last_active_date: null });
    await applyServerActivity(state);

    // Yesterday is written from the sum; today is this device's own row and
    // is left alone.
    expect(analytics.setDailyActivity).toHaveBeenCalledTimes(1);
    expect(analytics.setDailyActivity).toHaveBeenCalledWith({
      date: dayKey(yesterday),
      reading_seconds: 600,
      listening_seconds: 30,
      updatedAt: 0,
    });
    expect(analytics.updateSummary).toHaveBeenCalledWith({
      longest_streak: 9,
      total_days_active: 7,
      last_active_date: dayKey(yesterday),
    });
    expect(analytics.raiseAllTimeBaseline).toHaveBeenCalledWith(state.totals);
  });

  // The reinstall bug, in one test.
  //
  // A phone set up on the 2nd used to pull `?month=<this month>`, and both the
  // server and this function then discarded every earlier day — so the calendar
  // came back blank for a user whose reading was all in the previous month, and
  // stayed blank, because the calendar reads local rows only and never
  // re-fetches when you page back.
  it("restores days from EVERY month the account sent, not just the current one", async () => {
    jest.setSystemTime(new Date(2026, 8, 2, 10, 0, 0)); // 2 Sep — two days in
    analytics.getOrCreateSummary.mockResolvedValue({ last_active_date: null });

    await applyServerActivity({
      totals: { readingSeconds: 293, listeningSeconds: 0, daysActive: 1 },
      streaks: { current: 0, longest: 1 },
      days: {
        "2026-07-14": [400, 0],
        "2026-08-31": [293, 0], // the day that went missing
        "2026-09-01": [0, 0],
      },
    });

    const written = analytics.setDailyActivity.mock.calls.map(([row]) => row.date);
    expect(written).toEqual(["2026-07-14", "2026-08-31", "2026-09-01"]);
    expect(analytics.setDailyActivity).toHaveBeenCalledWith({
      date: "2026-08-31",
      reading_seconds: 293,
      listening_seconds: 0,
      updatedAt: 0,
    });
  });

  it("still leaves TODAY to this device, whatever month it falls in", async () => {
    jest.setSystemTime(new Date(2026, 8, 2, 10, 0, 0));
    analytics.getOrCreateSummary.mockResolvedValue({ last_active_date: null });

    await applyServerActivity({
      totals: {},
      streaks: {},
      days: { "2026-08-31": [293, 0], "2026-09-02": [120, 0] },
    });

    const written = analytics.setDailyActivity.mock.calls.map(([row]) => row.date);
    expect(written).toEqual(["2026-08-31"]);
  });

  it("never lowers a lifetime figure the account can no longer prove", async () => {
    // The account's day rows are archived after thirteen months, and a repair
    // can remove rows — so the server's count is not always the bigger one. A
    // best streak or a days-active total sliding down reads as lost data.
    analytics.getOrCreateSummary.mockResolvedValue({
      longest_streak: 12,
      total_days_active: 90,
      last_active_date: null,
    });

    await applyServerActivity(
      { totals: { daysActive: 84 }, streaks: { longest: 9 }, days: {} },
      monthKey(new Date(TODAY))
    );

    expect(analytics.updateSummary).toHaveBeenCalledWith({
      longest_streak: 12,
      total_days_active: 90,
    });
  });

  it("still takes the account's figure when it is the larger one", async () => {
    analytics.getOrCreateSummary.mockResolvedValue({
      longest_streak: 3,
      total_days_active: 10,
      last_active_date: null,
    });

    await applyServerActivity(
      { totals: { daysActive: 84 }, streaks: { longest: 9 }, days: {} },
      monthKey(new Date(TODAY))
    );

    expect(analytics.updateSummary).toHaveBeenCalledWith({
      longest_streak: 9,
      total_days_active: 84,
    });
  });

  it("never moves last_active_date backwards", async () => {
    const today = new Date(TODAY);
    const earlier = new Date(2026, 7, 17);
    analytics.getOrCreateSummary.mockResolvedValue({ last_active_date: dayKey(today) });
    await applyServerActivity(
      { totals: {}, streaks: {}, days: { [dayKey(earlier)]: [10, 0] } },
      monthKey(today)
    );
    expect(analytics.updateSummary).toHaveBeenCalledWith(
      expect.objectContaining({ last_active_date: dayKey(today) })
    );
  });

  it("is a no-op for a missing state", async () => {
    await applyServerActivity(null, "2026-08");
    expect(analytics.setDailyActivity).not.toHaveBeenCalled();
    expect(analytics.updateSummary).not.toHaveBeenCalled();
  });
});

describe("seedAnalyticsFromSnapshot — the streak is derived, not restored", () => {
  it("does not write the snapshot's streak on a refresh", async () => {
    // A refresh used to floor current_streak at the snapshot's copy, so the
    // number could go up and never come down — a lapsed streak stayed alive
    // for ever. computeStreaks rebuilds it from the day rows instead.
    analytics.getOrCreateSummary.mockResolvedValue({ current_streak: 2 });
    await seedAnalyticsFromSnapshot(
      {
        month: { key: "2025-06", days: [[1, 120, 0]] },
        streaks: { current: 14, longest: 31 },
        totals: { daysActive: 88 },
      },
      { merge: true }
    );
    expect(analytics.updateSummary.mock.calls[0][0]).not.toHaveProperty("current_streak");
  });

  it("still restores it on a bootstrap, where the snapshot is all there is", async () => {
    await seedAnalyticsFromSnapshot({
      month: { key: "2025-06", days: [[1, 120, 0]] },
      streaks: { current: 14, longest: 31 },
      totals: { daysActive: 88 },
    });
    expect(analytics.updateSummary.mock.calls[0][0].current_streak).toBe(14);
  });
});

describe("applyServerActivity — who owns the streak", () => {
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const dayKey = (d) => `${monthKey(d)}-${String(d.getDate()).padStart(2, "0")}`;
  it("does NOT adopt the server's own streak count", async () => {
    // The server counts with its own rule and the app recomputes with the
    // app's; with both writing, the number flipped between them on every
    // refresh. The app's rule wins, applied to the account's seconds.
    const today = new Date();
    analytics.getOrCreateSummary.mockResolvedValue({ last_active_date: null });

    await applyServerActivity(
      { totals: {}, streaks: { current: 5, longest: 9 }, days: {} },
      monthKey(today)
    );

    const fields = analytics.updateSummary.mock.calls[0][0];
    expect(fields).not.toHaveProperty("current_streak");
    expect(fields.longest_streak).toBe(9);
  });

  it("records what the account did TODAY, for the streak to weigh", async () => {
    // Today's row is never written from the server — it is still being
    // recorded here — so this is the only way the streak learns that another
    // device read today.
    const today = new Date();
    analytics.getOrCreateSummary.mockResolvedValue({ last_active_date: null });

    await applyServerActivity(
      { totals: {}, streaks: {}, days: { [dayKey(today)]: [300, 60] } },
      monthKey(today)
    );

    const stored = JSON.parse(await AsyncStorage.getItem("@dashboard_account_today_v1"));
    expect(stored).toEqual({ date: dayKey(today), seconds: 360 });
  });

  it("records a zero when the account has done nothing today", async () => {
    // So yesterday's answer cannot keep today alive.
    const today = new Date();
    analytics.getOrCreateSummary.mockResolvedValue({ last_active_date: null });

    await applyServerActivity({ totals: {}, streaks: {}, days: {} }, monthKey(today));

    const stored = JSON.parse(await AsyncStorage.getItem("@dashboard_account_today_v1"));
    expect(stored).toEqual({ date: dayKey(today), seconds: 0 });
  });
});
