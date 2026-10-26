/* eslint-env jest */
/**
 * The comparison that decides whether a day counts toward the streak.
 *
 * This exists because of a bug that produced no error and no failing test: a
 * day with 344 seconds of reading never matched a 240-second threshold, so the
 * streak sat at 0 while the week strip drew a gold tick for the very same day.
 *
 * The cause was SQLite type affinity. The original comparison was against a
 * COLUMN:
 *
 *     WHERE reading_seconds >= ?
 *
 * A column declared INTEGER carries INTEGER affinity, and SQLite applies that
 * affinity to the other operand — so a parameter arriving over the native
 * bridge as the string "240" was coerced to the number 240 and everything
 * worked. Pooling the two channels changed the left side to an EXPRESSION:
 *
 *     WHERE (reading_seconds + listening_seconds) >= ?
 *
 * An expression has NO affinity, so no coercion happens. SQLite then compares
 * across storage classes, where every numeric value sorts before every text
 * value — making the comparison false for EVERY row, forever, with no error.
 *
 * CAST(? AS INTEGER) forces the parameter to a number regardless of how it
 * arrives, which is what makes the pooled rule behave like the per-column one
 * it replaced.
 */
import { getQualifyingDates } from "./queries";

jest.mock("@common", () => ({ logError: jest.fn(), logMessage: jest.fn() }));
jest.mock("./queue", () => ({ runSerialized: (fn) => fn() }));

const asResult = (rows) => ({ rows: { length: rows.length, item: (i) => rows[i] } });

let lastSql = "";
let lastParams = [];
// Rows the fake database holds, as the real table stores them.
let tableRows = [];

const mockExecuteSql = jest.fn(async (sql, params) => {
  lastSql = sql;
  lastParams = params;

  // Models SQLite's actual comparison rules rather than JavaScript's, which is
  // the only way this test can catch the bug it exists for.
  const threshold = params[0];
  const castsParam = /CAST\(\s*\?\s+AS\s+INTEGER\s*\)/i.test(sql);
  const comparesAnExpression = /\(\s*reading_seconds\s*\+\s*listening_seconds\s*\)/.test(sql);

  const matches = tableRows.filter((row) => {
    const total = (row.reading_seconds ?? 0) + (row.listening_seconds ?? 0);
    // An un-CAST parameter compared against an affinity-less expression: if the
    // bridge handed over a string, no row can ever match.
    if (comparesAnExpression && !castsParam && typeof threshold === "string") return false;
    return total >= Number(threshold);
  });

  return [asResult(matches.map((row) => ({ date: row.date })))];
});

jest.mock("./connect", () => ({
  getAnalyticsDB: jest.fn(async () => ({ executeSql: (...a) => mockExecuteSql(...a) })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  lastSql = "";
  lastParams = [];
  tableRows = [];
});

describe("getQualifyingDates", () => {
  it("matches a qualifying day even when the threshold arrives as text", async () => {
    // THE REGRESSION. 344 seconds of reading against a 240 threshold returned
    // nothing, so the streak read 0 under a gold tick for the same day.
    tableRows = [{ date: "2026-08-20", reading_seconds: 344, listening_seconds: 0 }];

    expect(await getQualifyingDates("240")).toEqual(["2026-08-20"]);
    expect(await getQualifyingDates(240)).toEqual(["2026-08-20"]);
  });

  it("CASTs the parameter, because the left side is an expression", async () => {
    tableRows = [{ date: "2026-08-20", reading_seconds: 300, listening_seconds: 0 }];
    await getQualifyingDates(240);

    expect(lastSql).toMatch(/CAST\(\s*\?\s+AS\s+INTEGER\s*\)/i);
    expect(lastParams).toEqual([240]);
  });

  it("pools the two channels rather than judging them separately", async () => {
    tableRows = [
      { date: "2026-08-20", reading_seconds: 180, listening_seconds: 180 }, // 360 ✓
      { date: "2026-08-19", reading_seconds: 120, listening_seconds: 119 }, // 239 ✗
    ];

    expect(await getQualifyingDates(240)).toEqual(["2026-08-20"]);
  });

  it("treats the threshold as inclusive", async () => {
    tableRows = [
      { date: "2026-08-20", reading_seconds: 240, listening_seconds: 0 },
      { date: "2026-08-19", reading_seconds: 239, listening_seconds: 0 },
    ];

    expect(await getQualifyingDates(240)).toEqual(["2026-08-20"]);
  });

  it("returns an empty list when nothing qualifies", async () => {
    tableRows = [{ date: "2026-08-20", reading_seconds: 10, listening_seconds: 5 }];

    expect(await getQualifyingDates(240)).toEqual([]);
  });
});
