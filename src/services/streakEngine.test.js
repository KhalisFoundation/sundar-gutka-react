/* eslint-env jest */
/**
 * Tests for the streak recompute.
 *
 * The engine used to ratchet a stored counter forward one Dashboard visit at a
 * time, which meant it counted screen visits rather than reading days. These
 * cases pin the behaviour that replaced it: the streak is derived from the
 * `daily_activity` history on every run, so it does not care when — or
 * whether — the user opens the Dashboard.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getLatestActivityDate,
  getQualifyingDates,
  getOrCreateSummary,
  updateSummary,
} from "../database/analytics";
import { DASHBOARD_ACCOUNT_TODAY_KEY } from "./dashboard/syncKeys";
import { dayQualifies, shiftDate, getLocalDate } from "./streakDays";
import { computeStreaks } from "./streakEngine";

jest.mock("@common", () => ({
  logError: jest.fn(),
  constant: { MIN_DAILY_ACTIVE_SECONDS: 240 },
}));

jest.mock("../database/analytics", () => ({
  getLatestActivityDate: jest.fn(),
  getQualifyingDates: jest.fn(),
  getOrCreateSummary: jest.fn(),
  updateSummary: jest.fn(),
}));

const TODAY = "2026-08-20";

// Pure calendar arithmetic on the key, so fixtures are identical in every
// timezone — deliberately not shiftDate(), which is code under test here.
const dayBefore = (base, n) => {
  const [y, m, d] = base.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
};

// Freezes the clock at 10am LOCAL on the given day. Built through the
// local-time constructor rather than an ISO/UTC string so the engine's notion
// of "today" is that day whatever zone the suite runs in — jest.config.js pins
// TZ=UTC, but Node on Windows does not always honour it.
const clockAt = (ymd) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 10, 0, 0);
};

// `n` consecutive qualifying days ending on `end`, newest first — the shape
// getQualifyingDates returns.
const runEndingAt = (end, n) => Array.from({ length: n }, (_, i) => dayBefore(end, i));

const summaryRow = (over = {}) => ({
  current_streak: 0,
  longest_streak: 0,
  total_days_active: 0,
  last_active_date: null,
  ...over,
});

const fieldsWritten = () => updateSummary.mock.calls[0][0];

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  jest.useFakeTimers().setSystemTime(clockAt(TODAY));
  getOrCreateSummary.mockResolvedValue(summaryRow());
  getQualifyingDates.mockResolvedValue([]);
  // By default the history reaches exactly as far as the qualifying days do —
  // each test that cares sets its own.
  getLatestActivityDate.mockImplementation(async () => {
    const dates = await getQualifyingDates.mock.results[0]?.value;
    return dates?.[0] ?? null;
  });
  updateSummary.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("computeStreaks — counts reading days, not Dashboard visits", () => {
  it("counts every qualifying day when the Dashboard was opened only on the last one", async () => {
    // P0-1: the old engine compared today against last_active_date, saw a
    // two-day gap, called the streak broken and reset it to 1.
    getQualifyingDates.mockResolvedValue(runEndingAt(TODAY, 3));
    getOrCreateSummary.mockResolvedValue(
      summaryRow({ current_streak: 1, longest_streak: 1, last_active_date: dayBefore(TODAY, 2) })
    );

    await computeStreaks();

    expect(fieldsWritten().current_streak).toBe(3);
  });

  it("counts a month of reading when last_active_date was never written at all", async () => {
    // P0-1b: someone who checks the Dashboard BEFORE reading never satisfied
    // the old engine's `todayQualifies` branch, so last_active_date stayed null
    // and the streak sat on 0 forever under a full week of gold check marks.
    getQualifyingDates.mockResolvedValue(runEndingAt(TODAY, 30));
    getOrCreateSummary.mockResolvedValue(summaryRow({ current_streak: 0, last_active_date: null }));

    await computeStreaks();

    expect(fieldsWritten()).toMatchObject({
      current_streak: 30,
      longest_streak: 30,
      total_days_active: 30,
      last_active_date: TODAY,
    });
  });

  it("holds the streak when today has not qualified yet", async () => {
    // A day still in progress is "at risk", not a break — the number must not
    // read 0 every morning until the user has read.
    getQualifyingDates.mockResolvedValue(runEndingAt(dayBefore(TODAY, 1), 5));

    await computeStreaks();

    expect(fieldsWritten().current_streak).toBe(5);
  });

  it("restarts at the correct length after a real missed day", async () => {
    // Read today and yesterday, then a genuine gap, then an older run.
    getQualifyingDates.mockResolvedValue([
      ...runEndingAt(TODAY, 2),
      ...runEndingAt(dayBefore(TODAY, 4), 3),
    ]);

    await computeStreaks();

    expect(fieldsWritten().current_streak).toBe(2);
  });

  it("drops to 0 when neither today nor yesterday qualified", async () => {
    getQualifyingDates.mockResolvedValue(runEndingAt(dayBefore(TODAY, 2), 6));
    getOrCreateSummary.mockResolvedValue(summaryRow({ current_streak: 6, longest_streak: 6 }));

    await computeStreaks();

    expect(fieldsWritten().current_streak).toBe(0);
  });

  it("counts total_days_active from history, not from Dashboard visits", async () => {
    // P0-3: the old engine incremented once per qualifying visit, so read days
    // without a visit were lost and the figure only ever drifted low.
    getQualifyingDates.mockResolvedValue([
      ...runEndingAt(TODAY, 2),
      ...runEndingAt(dayBefore(TODAY, 10), 3),
    ]);
    getOrCreateSummary.mockResolvedValue(summaryRow({ total_days_active: 1 }));

    await computeStreaks();

    expect(fieldsWritten().total_days_active).toBe(5);
  });
});

describe("computeStreaks — longest streak", () => {
  it("recovers an all-time best from history that exceeds the current run", async () => {
    // P1-2: under the ratchet, longest could only ever be max(brokenCurrent,
    // stored), so a real best the counter never reached stayed invisible.
    getQualifyingDates.mockResolvedValue([
      ...runEndingAt(TODAY, 2),
      ...runEndingAt(dayBefore(TODAY, 10), 12),
    ]);
    getOrCreateSummary.mockResolvedValue(summaryRow({ longest_streak: 2 }));

    await computeStreaks();

    expect(fieldsWritten()).toMatchObject({ current_streak: 2, longest_streak: 12 });
  });

  it("never lowers a stored longest_streak the local history cannot account for", async () => {
    getQualifyingDates.mockResolvedValue(runEndingAt(TODAY, 3));
    getOrCreateSummary.mockResolvedValue(summaryRow({ longest_streak: 40 }));

    await computeStreaks();

    expect(fieldsWritten().longest_streak).toBe(40);
  });
});

describe("computeStreaks — clock and timezone edges", () => {
  it("does not collapse the streak when last_active_date is in the future", async () => {
    // P1-1: flying Auckland (UTC+13) → Los Angeles (UTC-7) moves the local date
    // backwards, so last_active_date sits ahead of today. The old engine's
    // dayGap went negative, missed both the `> 1` and `=== 1` branches and fell
    // through to `newStreak = 1`, wiping a 45-day streak as a reward for
    // reading. Same collapse from an NTP correction.
    getQualifyingDates.mockResolvedValue(runEndingAt(TODAY, 45));
    getOrCreateSummary.mockResolvedValue(
      summaryRow({ current_streak: 45, longest_streak: 45, last_active_date: "2026-08-21" })
    );

    await computeStreaks();

    expect(updateSummary).not.toHaveBeenCalled();
  });

  it("counts a run spanning a month boundary", async () => {
    jest.setSystemTime(clockAt("2026-09-02"));
    getQualifyingDates.mockResolvedValue(runEndingAt("2026-09-02", 5));

    await computeStreaks();

    expect(fieldsWritten().current_streak).toBe(5);
  });

  it("counts a run spanning a year boundary", async () => {
    jest.setSystemTime(clockAt("2027-01-02"));
    getQualifyingDates.mockResolvedValue(runEndingAt("2027-01-02", 6));

    await computeStreaks();

    expect(fieldsWritten()).toMatchObject({ current_streak: 6, last_active_date: "2027-01-02" });
  });
});

describe("computeStreaks — restore safety", () => {
  it("writes nothing when there is no day history to derive from", async () => {
    // A fresh install mid-restore: the summary may already carry the cloud
    // streak while the day rows are still landing. Writing zeros here would
    // wipe exactly what the restore just wrote.
    getQualifyingDates.mockResolvedValue([]);
    getOrCreateSummary.mockResolvedValue(summaryRow({ current_streak: 45, longest_streak: 45 }));

    await computeStreaks();

    expect(updateSummary).not.toHaveBeenCalled();
  });

  it("leaves a restored streak alone when the snapshot's day history is truncated", async () => {
    // last_active_date is newer than anything in daily_activity, so the local
    // history cannot verify the streak — keep the restored number rather than
    // overwrite it with a known-short one.
    getQualifyingDates.mockResolvedValue(runEndingAt(dayBefore(TODAY, 60), 4));
    // No row for that day either — genuinely missing history.
    getLatestActivityDate.mockResolvedValue(dayBefore(TODAY, 60));
    getOrCreateSummary.mockResolvedValue(
      summaryRow({ current_streak: 45, last_active_date: dayBefore(TODAY, 1) })
    );

    await computeStreaks();

    expect(updateSummary).not.toHaveBeenCalled();
  });

  it("floors lifetime figures against a restore that lands mid-computation", async () => {
    // P1-3: this is a read → read → write across three slots on the serialized
    // DB chain, not a transaction, and a restore fires on the same Dashboard
    // mount. The pre-write re-read is what stops stale values clobbering it.
    getQualifyingDates.mockResolvedValue(runEndingAt(TODAY, 3));
    getOrCreateSummary
      .mockResolvedValueOnce(summaryRow())
      .mockResolvedValueOnce(
        summaryRow({ current_streak: 45, longest_streak: 45, total_days_active: 120 })
      );

    await computeStreaks();

    expect(fieldsWritten()).toMatchObject({ longest_streak: 45, total_days_active: 120 });
  });

  it("keeps a longer restored streak the local history is too short to disprove", async () => {
    // A restored snapshot carries only recent months of day rows. The walk here
    // runs off the start of that history rather than stopping on a day the user
    // missed, so the real run may well be the stored 45 — don't lower it.
    getQualifyingDates.mockResolvedValue(runEndingAt(TODAY, 20));
    getOrCreateSummary.mockResolvedValue(summaryRow({ current_streak: 45, longest_streak: 45 }));

    await computeStreaks();

    expect(fieldsWritten().current_streak).toBe(45);
  });

  it("still resets when the walk stops on a real gap inside the history", async () => {
    // The mirror of the case above: the history DOES cover the break, so the
    // reset is trustworthy and a stale stored streak must not survive it.
    getQualifyingDates.mockResolvedValue([
      ...runEndingAt(TODAY, 2),
      ...runEndingAt(dayBefore(TODAY, 5), 10),
    ]);
    getOrCreateSummary.mockResolvedValue(summaryRow({ current_streak: 45, longest_streak: 45 }));

    await computeStreaks();

    expect(fieldsWritten().current_streak).toBe(2);
  });

  it("never walks last_active_date backwards", async () => {
    getQualifyingDates.mockResolvedValue(runEndingAt(TODAY, 3));
    getOrCreateSummary.mockResolvedValue(summaryRow({ last_active_date: TODAY }));

    await computeStreaks();

    expect(fieldsWritten().last_active_date).toBe(TODAY);
  });
});

describe("computeStreaks — qualification rule", () => {
  it("asks the database for the pooled threshold, not two per-channel ones", async () => {
    getQualifyingDates.mockResolvedValue(runEndingAt(TODAY, 1));

    await computeStreaks();

    expect(getQualifyingDates).toHaveBeenCalledWith(240);
    expect(getQualifyingDates).toHaveBeenCalledTimes(1);
  });
});

describe("dayQualifies — reading and listening pool", () => {
  const row = (reading, listening) => ({
    reading_seconds: reading,
    listening_seconds: listening,
  });

  it("counts a day split across both channels", () => {
    // The case the old per-channel OR rule silently failed: six minutes of
    // real activity, neither channel reaching four on its own.
    expect(dayQualifies(row(180, 180))).toBe(true);
    expect(dayQualifies(row(120, 120))).toBe(true);
  });

  it("counts a day from either channel alone", () => {
    expect(dayQualifies(row(240, 0))).toBe(true);
    expect(dayQualifies(row(0, 240))).toBe(true);
  });

  it("rejects a day whose combined total falls short", () => {
    expect(dayQualifies(row(120, 119))).toBe(false);
    expect(dayQualifies(row(0, 0))).toBe(false);
  });

  it("treats the threshold as inclusive", () => {
    expect(dayQualifies(row(239, 0))).toBe(false);
    expect(dayQualifies(row(120, 120))).toBe(true);
  });

  it("handles missing rows and missing columns", () => {
    expect(dayQualifies(null)).toBe(false);
    expect(dayQualifies(undefined)).toBe(false);
    expect(dayQualifies({})).toBe(false);
    expect(dayQualifies({ reading_seconds: 240 })).toBe(true);
    expect(dayQualifies({ listening_seconds: 240 })).toBe(true);
  });
});

describe("computeStreaks — failure handling", () => {
  it("swallows a database failure instead of breaking the Dashboard focus effect", async () => {
    getQualifyingDates.mockRejectedValue(new Error("db is wedged"));

    await expect(computeStreaks()).resolves.toBeUndefined();
    expect(updateSummary).not.toHaveBeenCalled();
  });
});

describe("streakDays", () => {
  it("shifts across month, year and leap-day boundaries", () => {
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDate("2024-03-01", -1)).toBe("2024-02-29");
    expect(shiftDate("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDate("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("zero-pads single-digit months and days", () => {
    expect(getLocalDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("computeStreaks — a short day is history, not a hole", () => {
  // What the user saw: last real reading on Thursday, a one-minute Friday,
  // nothing since — and the card still read two days on Sunday. The engine
  // compared last_active_date (written from any activity at all) against the
  // newest QUALIFYING day, decided its own history was truncated, and never
  // recomputed, so a stale number stood for ever.
  it("recomputes when the newest row is a day too short to qualify", async () => {
    getQualifyingDates.mockResolvedValue(runEndingAt(dayBefore(TODAY, 4), 2));
    getLatestActivityDate.mockResolvedValue(dayBefore(TODAY, 2));
    getOrCreateSummary.mockResolvedValue(
      summaryRow({ current_streak: 2, last_active_date: dayBefore(TODAY, 2) })
    );

    await computeStreaks();

    expect(fieldsWritten().current_streak).toBe(0);
  });

  it("resets to 0 when rows exist but none of them qualify", async () => {
    getQualifyingDates.mockResolvedValue([]);
    getLatestActivityDate.mockResolvedValue(dayBefore(TODAY, 1));
    getOrCreateSummary.mockResolvedValue(summaryRow({ current_streak: 2, longest_streak: 9 }));

    await computeStreaks();

    expect(fieldsWritten().current_streak).toBe(0);
    // Lifetime figures still never walk backwards.
    expect(fieldsWritten().longest_streak).toBe(9);
  });

  it("does not let a short day become the streak's last day", async () => {
    getQualifyingDates.mockResolvedValue(runEndingAt(TODAY, 2));
    getLatestActivityDate.mockResolvedValue(TODAY);
    getOrCreateSummary.mockResolvedValue(summaryRow());

    await computeStreaks();

    expect(fieldsWritten().last_active_date).toBe(TODAY);
  });
});

describe("computeStreaks — the account's other devices", () => {
  // Today's day row is this device's own and is never written from the server,
  // so without the account's total for today a phone that had not been opened
  // would end a streak the tablet was keeping alive. The rule applied is the
  // app's, on the account's seconds — the server's finished streak is not
  // adopted, because two writers with two rules made the number flip on every
  // refresh.
  const accountToday = (date, seconds) =>
    AsyncStorage.setItem(DASHBOARD_ACCOUNT_TODAY_KEY, JSON.stringify({ date, seconds }));

  it("counts today when another device on the account read it", async () => {
    getQualifyingDates.mockResolvedValue(runEndingAt(dayBefore(TODAY, 1), 2));
    getLatestActivityDate.mockResolvedValue(dayBefore(TODAY, 1));
    await accountToday(TODAY, 600);

    await computeStreaks();

    // Yesterday and the day before are this device's; today is the account's.
    expect(fieldsWritten().current_streak).toBe(3);
    expect(fieldsWritten().last_active_date).toBe(TODAY);
  });

  it("holds the streak at yesterday when the account's day is too short", async () => {
    getQualifyingDates.mockResolvedValue(runEndingAt(dayBefore(TODAY, 1), 2));
    getLatestActivityDate.mockResolvedValue(dayBefore(TODAY, 1));
    await accountToday(TODAY, 100);

    await computeStreaks();

    expect(fieldsWritten().current_streak).toBe(2);
  });

  it("ignores a total left over from a previous day", async () => {
    getQualifyingDates.mockResolvedValue([]);
    getLatestActivityDate.mockResolvedValue(dayBefore(TODAY, 3));
    await accountToday(dayBefore(TODAY, 1), 6000);

    await computeStreaks();

    expect(fieldsWritten().current_streak).toBe(0);
  });
});
