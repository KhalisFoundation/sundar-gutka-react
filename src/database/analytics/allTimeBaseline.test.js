/* eslint-env jest */
/**
 * The arithmetic behind "all time", and the ratchet it used to have.
 *
 * An all-time figure is stored in two halves: a FROZEN BASELINE in
 * user_stats_summary (everything that happened before this install) and a LIVE
 * count recomputed from the raw session tables on every read. What the user
 * sees is the sum.
 *
 * A cloud snapshot carries the SUM — the device that pushed it had already
 * added its own live rows in. Writing that number back into the baseline column
 * therefore counts this device's sessions twice, and again on the next pull,
 * and again on the one after: a user with one completed bani on this install
 * watched the count climb by exactly one on every pull-to-refresh, while the
 * other phone — which had no live sessions of its own — sat perfectly still.
 *
 * These tests pin the two properties that make it impossible: what the user
 * SEES only ever goes up, and running the same restore twice changes nothing.
 */
import { getAllTimeTotals, raiseAllTimeBaseline } from "./queries";

jest.mock("@common", () => ({ logError: jest.fn(), logMessage: jest.fn() }));
jest.mock("./queue", () => ({ runSerialized: (fn) => fn() }));

// The four numbers the fake database is built from.
let mockDb = {
  summary: {},
  liveReadingSeconds: 0,
  liveListeningSeconds: 0,
  liveAudioSessions: 0,
  liveBanisCompleted: 0,
  dailyReadingSeconds: 0,
  dailyListeningSeconds: 0,
};

const asResult = (rows) => ({
  rows: { length: rows.length, item: (i) => rows[i] },
});

const mockExecuteSql = jest.fn(async (sql, params) => {
  // Checked FIRST: an UPDATE naming total_audio_sessions would otherwise be
  // caught by the live-totals matcher below and silently dropped.
  if (sql.startsWith("UPDATE user_stats_summary")) {
    // Mirror the write back, so a second call reads what the first stored —
    // which is the only way an idempotence test can mean anything.
    const columns = sql
      .slice(sql.indexOf("SET") + 3, sql.indexOf("updated_at"))
      .split(",")
      .map((c) => c.split("=")[0].trim())
      .filter(Boolean);
    columns.forEach((col, i) => {
      mockDb.summary = { ...mockDb.summary, [col]: params[i] };
    });
    return [asResult([])];
  }
  if (sql.includes("FROM user_stats_summary")) return [asResult([mockDb.summary])];
  if (sql.includes("FROM bani_read_history WHERE completed = 1")) {
    return [asResult([{ cnt: mockDb.liveBanisCompleted }])];
  }
  if (sql.includes("FROM daily_activity")) {
    return [
      asResult([
        {
          total_reading_seconds: mockDb.dailyReadingSeconds,
          total_listening_seconds: mockDb.dailyListeningSeconds,
        },
      ]),
    ];
  }
  if (sql.includes("total_audio_sessions")) {
    return [
      asResult([
        {
          total_reading_seconds: mockDb.liveReadingSeconds,
          total_listening_seconds: mockDb.liveListeningSeconds,
          total_audio_sessions: mockDb.liveAudioSessions,
        },
      ]),
    ];
  }
  throw new Error(`unexpected SQL: ${sql}`);
});

jest.mock("./connect", () => ({
  getAnalyticsDB: async () => ({ executeSql: (...a) => mockExecuteSql(...a) }),
}));

beforeEach(() => {
  mockExecuteSql.mockClear();
  mockDb = {
    summary: {
      total_reading_seconds: 0,
      total_listening_seconds: 0,
      total_audio_sessions: 0,
      total_banis_read: 0,
    },
    liveReadingSeconds: 0,
    liveListeningSeconds: 0,
    liveAudioSessions: 0,
    liveBanisCompleted: 0,
    dailyReadingSeconds: 0,
    dailyListeningSeconds: 0,
  };
});

describe("raiseAllTimeBaseline", () => {
  it("REGRESSION: refreshing over and over does not inflate the count", async () => {
    // The reported bug, reproduced end to end. Five banis in the account's
    // history, one of them completed on THIS install, so the device correctly
    // shows five — and must still show five after ten pulls.
    mockDb.summary.total_banis_read = 4;
    mockDb.liveBanisCompleted = 1;
    expect((await getAllTimeTotals()).banisCompleted).toBe(5);

    const snapshot = { banisCompleted: 5 };
    for (let i = 0; i < 10; i += 1) {
      // Sequential on purpose — each pull has to read what the last one wrote,
      // which is exactly what the bug did not survive.
      /* eslint-disable no-await-in-loop */
      await raiseAllTimeBaseline(snapshot);
      expect((await getAllTimeTotals()).banisCompleted).toBe(5);
      /* eslint-enable no-await-in-loop */
    }
    // And the frozen half is still just the part that predates this install.
    expect(mockDb.summary.total_banis_read).toBe(4);
  });

  it("takes the account's higher figure when another device has done more", async () => {
    mockDb.summary.total_banis_read = 4;
    mockDb.liveBanisCompleted = 1;

    await raiseAllTimeBaseline({ banisCompleted: 12 });

    expect((await getAllTimeTotals()).banisCompleted).toBe(12);
    // Solved for, not assigned: 12 shown = 11 baseline + this install's 1.
    expect(mockDb.summary.total_banis_read).toBe(11);
  });

  it("keeps counting this device's OWN sessions after adopting a bigger figure", async () => {
    // The point of splitting the halves. Adopting 12 must not freeze the
    // number — the next bani read here has to make it 13.
    mockDb.summary.total_banis_read = 4;
    mockDb.liveBanisCompleted = 1;
    await raiseAllTimeBaseline({ banisCompleted: 12 });

    mockDb.liveBanisCompleted = 2;
    expect((await getAllTimeTotals()).banisCompleted).toBe(13);
  });

  it("never lets a stale snapshot drag a number down", async () => {
    mockDb.summary.total_banis_read = 20;
    mockDb.liveBanisCompleted = 3;

    await raiseAllTimeBaseline({ banisCompleted: 1 });

    expect((await getAllTimeTotals()).banisCompleted).toBe(23);
  });

  it("raises seconds and audio sessions by the same rule", async () => {
    mockDb.summary.total_reading_seconds = 1000;
    mockDb.liveReadingSeconds = 122;
    mockDb.summary.total_audio_sessions = 2;
    mockDb.liveAudioSessions = 1;

    await raiseAllTimeBaseline({ readingSeconds: 5000, audioSessions: 9 });

    const totals = await getAllTimeTotals();
    expect(totals.readingSeconds).toBe(5000);
    expect(totals.audioSessions).toBe(9);
  });

  it("is idempotent for seconds too, even with the daily_activity floor in play", async () => {
    // readingSeconds is floored against the day-by-day table, so its `shown`
    // value can come from a different source than baseline+live. The solve has
    // to stay stable across that.
    mockDb.summary.total_reading_seconds = 1000;
    mockDb.liveReadingSeconds = 122;
    mockDb.dailyReadingSeconds = 3000;
    expect((await getAllTimeTotals()).readingSeconds).toBe(3000);

    await raiseAllTimeBaseline({ readingSeconds: 3000 });
    expect((await getAllTimeTotals()).readingSeconds).toBe(3000);
    await raiseAllTimeBaseline({ readingSeconds: 3000 });
    expect((await getAllTimeTotals()).readingSeconds).toBe(3000);
  });

  it("leaves a figure the snapshot does not mention completely alone", async () => {
    mockDb.summary.total_audio_sessions = 7;
    await raiseAllTimeBaseline({ banisCompleted: 3 });
    expect(mockDb.summary.total_audio_sessions).toBe(7);
  });

  it("never writes a negative baseline", async () => {
    // A device whose live rows already exceed the account's total — possible
    // after a cloud repair — must clamp at zero rather than store a negative.
    mockDb.summary.total_banis_read = 0;
    mockDb.liveBanisCompleted = 8;
    await raiseAllTimeBaseline({ banisCompleted: 2 });
    expect(mockDb.summary.total_banis_read).toBe(0);
    expect((await getAllTimeTotals()).banisCompleted).toBe(8);
  });

  it("writes nothing at all when the snapshot carries no totals", async () => {
    await raiseAllTimeBaseline({});
    expect(mockExecuteSql.mock.calls.filter(([sql]) => sql.startsWith("UPDATE"))).toHaveLength(0);
  });
});
