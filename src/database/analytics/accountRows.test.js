/* eslint-env jest */
/**
 * Day rows written from the ACCOUNT's summed activity are not this device's
 * work. If the activity push ever sent them, every other device's minutes
 * would go up under this device's name, come back down doubled on the next
 * pull, and double again on every pull after that.
 */
import { getActivityUpdatedSince, setDailyActivity } from "./queries";

jest.mock("@common", () => ({ logError: jest.fn(), logMessage: jest.fn() }));
jest.mock("./queue", () => ({ runSerialized: (fn) => fn() }));

const mockExecuteSql = jest.fn(async () => [{ rowsAffected: 1, rows: { length: 0 } }]);
jest.mock("./connect", () => ({
  getAnalyticsDB: () => Promise.resolve({ executeSql: (...a) => mockExecuteSql(...a) }),
}));

const sqlOf = (call) => call[0].replace(/\s+/g, " ").trim();

beforeEach(() => mockExecuteSql.mockClear());

it("a row written from the account carries updated_at = 0, not the clock", async () => {
  await setDailyActivity({ date: "2026-08-20", reading_seconds: 600, updatedAt: 0 });
  const [sql, params] = mockExecuteSql.mock.calls[0];
  expect(sqlOf([sql])).toMatch(/updated_at = COALESCE\(\?, strftime/);
  expect(params).toEqual([600, 0, 600, 0, "2026-08-20"]);
});

it("this device's own writes still take the clock", async () => {
  await setDailyActivity({ date: "2026-08-20", reading_seconds: 600 });
  expect(mockExecuteSql.mock.calls[0][1]).toEqual([600, 0, 600, null, "2026-08-20"]);
});

it("the activity push never picks up account rows, even from a zero watermark", async () => {
  await getActivityUpdatedSince(0);
  const [sql, params] = mockExecuteSql.mock.calls[0];
  expect(sqlOf([sql])).toMatch(/WHERE updated_at > 0 AND updated_at >= \?/);
  expect(params).toEqual([0]);
});
