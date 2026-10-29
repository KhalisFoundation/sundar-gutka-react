/* eslint-env jest */
/**
 * The three insert-or-update writes must run on the SQLite every supported
 * phone ships: Android uses the OS's own library, and `ON CONFLICT … DO UPDATE`
 * only exists from 3.24 (Android 10). On Android 7–9 it was a syntax error on
 * every bani read and every minute of activity, so nothing was recorded there.
 */
import { incrementBaniReadCount, setDailyActivity, upsertDailyActivity } from "./queries";

const mockLogError = jest.fn();
jest.mock("@common", () => ({ logError: (...a) => mockLogError(...a), logMessage: jest.fn() }));
jest.mock("./queue", () => ({ runSerialized: (fn) => fn() }));

let mockRowsAffected = 0;
const mockExecuteSql = jest.fn(async () => [
  { rowsAffected: mockRowsAffected, rows: { length: 0 } },
]);
jest.mock("./connect", () => ({
  getAnalyticsDB: () => Promise.resolve({ executeSql: (...a) => mockExecuteSql(...a) }),
}));

const executed = () => mockExecuteSql.mock.calls.map(([sql]) => sql.replace(/\s+/g, " ").trim());

describe.each([
  ["incrementBaniReadCount", () => incrementBaniReadCount(2, "Japji Sahib")],
  [
    "upsertDailyActivity",
    () => upsertDailyActivity({ date: "2026-08-29", reading_seconds_delta: 60 }),
  ],
  ["setDailyActivity", () => setDailyActivity({ date: "2026-08-29", reading_seconds: 600 })],
])("%s", (_name, run) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRowsAffected = 0;
  });

  it("never uses upsert syntax that older Android SQLite rejects", async () => {
    await run();
    executed().forEach((sql) => {
      expect(sql).not.toMatch(/ON CONFLICT/i);
      expect(sql).not.toMatch(/excluded\./i);
    });
  });

  it("updates the existing row and inserts nothing when one is there", async () => {
    mockRowsAffected = 1;
    await run();
    expect(executed()).toHaveLength(1);
    expect(executed()[0]).toMatch(/^UPDATE /);
  });

  it("inserts the row when the update touched nothing", async () => {
    await run();
    expect(executed()).toHaveLength(2);
    expect(executed()[0]).toMatch(/^UPDATE /);
    expect(executed()[1]).toMatch(/^INSERT INTO /);
    expect(mockLogError).not.toHaveBeenCalled();
  });
});

describe("the arithmetic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRowsAffected = 1;
  });

  it("a read adds one and takes the latest title and date", async () => {
    await incrementBaniReadCount(2, "Japji Sahib");
    const [sql, params] = mockExecuteSql.mock.calls[0];
    expect(sql).toMatch(/read_count = read_count \+ 1/);
    expect(params).toEqual(["Japji Sahib", new Date().toISOString().slice(0, 10), 2]);
  });

  it("activity deltas add on to the day; a restore overwrites it", async () => {
    await upsertDailyActivity({
      date: "d",
      reading_seconds_delta: 30,
      listening_seconds_delta: 10,
    });
    expect(mockExecuteSql.mock.calls[0][0]).toMatch(
      /reading_seconds\s*=\s*reading_seconds\s*\+ \?/
    );
    expect(mockExecuteSql.mock.calls[0][1]).toEqual([30, 10, 40, "d"]);

    await setDailyActivity({ date: "d", reading_seconds: 300, listening_seconds: 100 });
    expect(mockExecuteSql.mock.calls[1][0]).not.toMatch(/reading_seconds\s*\+/);
    expect(mockExecuteSql.mock.calls[1][1]).toEqual([300, 100, 400, null, "d"]);
  });
});
