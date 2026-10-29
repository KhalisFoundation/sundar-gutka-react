/* eslint-env jest */
/**
 * The additive half of sync, client side.
 *
 * The snapshot push can only ever be last-write-wins — two devices each build
 * their payload from their own local database, so the later one overwrites the
 * earlier one's totals. These per-day rows are sent alongside it precisely
 * because they CAN be combined: the server sums them across devices.
 *
 * The two properties that make the client half safe are that it sends the
 * device's own LOCAL day (not a UTC-derived one), and that it never advances
 * its watermark on a failure.
 */

import * as analytics from "../../database/analytics";
import { buildActivityPayload, pushDailyActivity } from "./dashboardSync";

const mockReadToken = jest.fn(async () => "test.jwt.token");
jest.mock("../../common/sso/tokenStore", () => ({
  readToken: (...a) => mockReadToken(...a),
}));

jest.mock("@common", () => ({
  constant: {
    DASHBOARD_API_BASE_URL: "http://api.test",
    DASHBOARD_ACTIVITY_API_URL: "http://api.test/dashboard/activity",
  },
  logError: jest.fn(),
  STRINGS: { time_for: "Time for" },
  updateReminders: jest.fn(),
  actions: {},
}));

jest.mock("@database", () => ({ getBaniList: jest.fn(async () => []) }));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

jest.mock("../../database/analytics", () => ({
  getActivityUpdatedSince: jest.fn(async () => []),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockReadToken.mockResolvedValue("test.jwt.token");
});

describe("buildActivityPayload", () => {
  it("sends the day exactly as SQLite stores it — the DEVICE'S LOCAL day", async () => {
    // Amrit Vela is roughly 03:00-06:00 IST, which is 21:30-00:30 UTC the day
    // before. Deriving the day from a timestamp server-side would file most
    // Indian morning nitnem under the previous date; the device already knows.
    analytics.getActivityUpdatedSince.mockResolvedValue([
      { date: "2026-08-19", reading_seconds: 900, listening_seconds: 120 },
    ]);

    const body = await buildActivityPayload({ deviceId: "phone", since: 0 });

    expect(body).toEqual({
      deviceId: "phone",
      days: [{ date: "2026-08-19", readingSeconds: 900, listeningSeconds: 120 }],
    });
  });

  it("asks only for days changed since the watermark", async () => {
    await buildActivityPayload({ deviceId: "phone", since: 1755600000 });
    expect(analytics.getActivityUpdatedSince).toHaveBeenCalledWith(1755600000);
  });

  it("rounds and floors, so a fractional or negative second never reaches the API", async () => {
    analytics.getActivityUpdatedSince.mockResolvedValue([
      { date: "2026-08-19", reading_seconds: 12.7, listening_seconds: -5 },
    ]);
    const body = await buildActivityPayload({ deviceId: "phone", since: 0 });
    expect(body.days[0]).toEqual({
      date: "2026-08-19",
      readingSeconds: 13,
      listeningSeconds: 0,
    });
  });

  it("tolerates a row with no seconds recorded yet", async () => {
    analytics.getActivityUpdatedSince.mockResolvedValue([{ date: "2026-08-19" }]);
    const body = await buildActivityPayload({ deviceId: "phone", since: 0 });
    expect(body.days[0]).toEqual({
      date: "2026-08-19",
      readingSeconds: 0,
      listeningSeconds: 0,
    });
  });
});

describe("pushDailyActivity", () => {
  const body = {
    deviceId: "phone",
    days: [{ date: "2026-08-19", readingSeconds: 900, listeningSeconds: 0 }],
  };

  it("does not make a request when there is nothing to send", async () => {
    global.fetch = jest.fn();
    const res = await pushDailyActivity({ deviceId: "phone", days: [] });
    expect(res).toEqual({ ok: true, skipped: true });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts the rows for a signed-in account", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 }));
    expect(await pushDailyActivity(body)).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/dashboard/activity",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("REPORTS a failure rather than throwing — it must never break the snapshot push", async () => {
    // This rides alongside the older, more-proven path. A throw here would take
    // that down with it.
    global.fetch = jest.fn(async () => ({ ok: false, status: 500 }));
    expect(await pushDailyActivity(body)).toEqual({ ok: false, status: 500 });
  });

  it("reports a transport failure the same way", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("Network request failed");
    });
    const res = await pushDailyActivity(body);
    expect(res.ok).toBe(false);
    expect(res.error).toBe("Network request failed");
  });

  it("reports 401 as unauthorized without treating it as an error", async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 401 }));
    expect(await pushDailyActivity(body)).toEqual({
      ok: false,
      unauthorized: true,
      status: 401,
    });
  });

  it("never reaches the network with no session", async () => {
    mockReadToken.mockResolvedValue(null);
    global.fetch = jest.fn();
    expect(await pushDailyActivity(body)).toEqual({
      ok: false,
      unauthorized: true,
      status: 401,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
