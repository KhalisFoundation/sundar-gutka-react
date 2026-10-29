/* eslint-env jest */
import { secondsPerDay, splitSpanByLocalDay } from "./streakDays";

jest.mock("@common", () => ({
  constant: { MIN_DAILY_ACTIVE_SECONDS: 240 },
}));

// jest.config.js pins TZ to UTC, so local time is UTC here. The DST behaviour
// (splitting at a real local midnight on a 23- or 25-hour day) comes from using
// the local-time Date constructor and cannot be exercised under a fixed zone.
const at = (iso) => new Date(iso).getTime();

describe("splitSpanByLocalDay", () => {
  it("keeps a span inside one day whole", () => {
    expect(splitSpanByLocalDay(at("2026-08-20T09:00:00Z"), at("2026-08-20T09:16:00Z"))).toEqual({
      "2026-08-20": 16 * 60 * 1000,
    });
  });

  it("splits a span that crosses midnight at the boundary", () => {
    expect(splitSpanByLocalDay(at("2026-08-20T23:50:00Z"), at("2026-08-21T00:06:00Z"))).toEqual({
      "2026-08-20": 10 * 60 * 1000,
      "2026-08-21": 6 * 60 * 1000,
    });
  });

  it("gives a whole intervening day its full 24 hours", () => {
    const spans = splitSpanByLocalDay(at("2026-08-20T23:00:00Z"), at("2026-08-22T01:00:00Z"));
    expect(spans).toEqual({
      "2026-08-20": 60 * 60 * 1000,
      "2026-08-21": 24 * 60 * 60 * 1000,
      "2026-08-22": 60 * 60 * 1000,
    });
  });

  it("crosses a month and a leap day", () => {
    expect(splitSpanByLocalDay(at("2028-02-28T23:30:00Z"), at("2028-02-29T00:30:00Z"))).toEqual({
      "2028-02-28": 30 * 60 * 1000,
      "2028-02-29": 30 * 60 * 1000,
    });
  });

  it("returns nothing for an empty or backwards span", () => {
    expect(splitSpanByLocalDay(at("2026-08-20T09:00:00Z"), at("2026-08-20T09:00:00Z"))).toEqual({});
    expect(splitSpanByLocalDay(at("2026-08-20T09:00:00Z"), at("2026-08-19T09:00:00Z"))).toEqual({});
  });

  it("bounds the fan-out when a clock correction stretches a span, without losing time", () => {
    const start = at("2026-01-01T00:00:00Z");
    const end = at("2027-01-01T00:00:00Z");
    const spans = splitSpanByLocalDay(start, end);
    // Capped at MAX_SPAN_DAYS rows rather than one per day of the year...
    expect(Object.keys(spans).length).toBeLessThanOrEqual(32);
    // ...and the remainder lands on the last day rather than vanishing.
    const total = Object.values(spans).reduce((sum, ms) => sum + ms, 0);
    expect(total).toBe(end - start);
  });
});

describe("secondsPerDay", () => {
  it("rounds to whole seconds, oldest day first", () => {
    expect(secondsPerDay({ "2026-08-21": 6000, "2026-08-20": 10000 })).toEqual([
      { date: "2026-08-20", seconds: 10 },
      { date: "2026-08-21", seconds: 6 },
    ]);
  });

  it("preserves the total exactly when the parts do not round cleanly", () => {
    // 1.5s + 1.5s: rounding each independently would give 2 + 2 = 4s for a
    // 3s session, so the day rows would not add up to the session row.
    const slices = secondsPerDay({ "2026-08-20": 1500, "2026-08-21": 1500 });
    expect(slices.reduce((sum, s) => sum + s.seconds, 0)).toBe(3);
  });

  it("drops days that round down to nothing", () => {
    // A session that crosses midnight by 200ms should not write a 0-second row.
    expect(secondsPerDay({ "2026-08-20": 60000, "2026-08-21": 200 })).toEqual([
      { date: "2026-08-20", seconds: 60 },
    ]);
  });

  it("returns nothing for an empty map", () => {
    expect(secondsPerDay({})).toEqual([]);
  });
});
