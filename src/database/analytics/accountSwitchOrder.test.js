/* eslint-env jest */
/**
 * A pull queues hundreds of writes for the account it began for. Switching the
 * file underneath them sent the rest into the next store — the signed-out one,
 * which the next sign-in then claims as its own activity. The switch waits its
 * turn in the same queue now.
 */
import { getAnalyticsDB, useAnalyticsAccount } from "./connect";
import { AccountSwitchedError, setDailyActivity } from "./queries";
import { runSerialized } from "./queue";

jest.mock("react-native-sqlite-storage", () => ({
  enablePromise: jest.fn(),
  openDatabase: jest.fn(async ({ name }) => {
    return { name, close: jest.fn(async () => {}), executeSql: jest.fn(async () => [{}]) };
  }),
}));
jest.mock("@common", () => ({ logError: jest.fn(), logMessage: jest.fn() }));
jest.mock("./schema", () => ({ initSchema: jest.fn(async () => {}) }));

it("lets writes queued for an account finish on that account's file before switching", async () => {
  await useAnalyticsAccount("a@khalis.net");
  const written = [];
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  // A write for A, still waiting its turn when the switch is asked for.
  const write = runSerialized(async () => {
    await gate;
    written.push((await getAnalyticsDB()).name);
  });
  const switching = useAnalyticsAccount(null);
  release();
  await Promise.all([write, switching]);

  // A's own file, not the signed-out store.
  expect(written).toEqual([expect.stringMatching(/^analytics_v01_[0-9a-f]{8}\.db$/)]);
  // And the next query reads the signed-out store.
  const after = await runSerialized(async () => (await getAnalyticsDB()).name);
  expect(after).toBe("analytics_v01.db");
});

// Issued for A after the switch was asked for, it would reach the queue behind
// the switch and run against the signed-out store.
it("refuses a write issued for an account that has been switched away from", async () => {
  await useAnalyticsAccount("a@khalis.net");
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const gate = runSerialized(() => held);
  const switching = useAnalyticsAccount(null);
  const lateWrite = setDailyActivity({ date: "2026-08-20", reading_seconds: 600, updatedAt: 0 });
  release();
  await gate;
  await switching;
  await expect(lateWrite).rejects.toBeInstanceOf(AccountSwitchedError);
});
