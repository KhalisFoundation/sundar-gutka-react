/* eslint-env jest */
/**
 * A day's totals take the account's figures on a pull, so the activity push
 * sends this device's OWN seconds from their own columns. Databases written by
 * the previous release have no such columns; they are added on open, and
 * seeded only from the rows this device wrote itself.
 */
import { initSchema } from "./schema";

const fakeDb = (columns) => {
  const executeSql = jest.fn(async (sql) => {
    if (/PRAGMA table_info\(daily_activity\)/.test(sql)) {
      return [{ rows: { length: columns.length, item: (i) => ({ name: columns[i] }) } }];
    }
    if (/PRAGMA table_info/.test(sql)) {
      return [{ rows: { length: 1, item: () => ({ name: "artist_name" }) } }];
    }
    return [{ rows: { length: 0 } }];
  });
  return { executeSql };
};

const statements = (db) => db.executeSql.mock.calls.map(([sql]) => sql.replace(/\s+/g, " "));

it("adds the own-seconds columns to an older database, seeded from this device's rows", async () => {
  const db = fakeDb(["date", "reading_seconds", "listening_seconds", "updated_at"]);
  await initSchema(db);
  const sql = statements(db);
  expect(sql.some((s) => /ADD COLUMN own_reading_seconds/.test(s))).toBe(true);
  expect(sql.some((s) => /ADD COLUMN own_listening_seconds/.test(s))).toBe(true);
  const seed = sql.find((s) => /SET own_reading_seconds = MIN\(reading_seconds/.test(s));
  // From this device's own sessions, capped at the day's total — the total can
  // hold another device's minutes that the previous release merged in.
  expect(seed).toMatch(/FROM bani_read_history/);
  expect(seed).toMatch(/FROM audio_history/);
  // Account-written rows (updated_at = 0) are the account's sums, not ours.
  expect(seed).toMatch(/WHERE updated_at > 0/);
});

it("leaves a database that already has them alone", async () => {
  const db = fakeDb(["date", "own_reading_seconds", "own_listening_seconds"]);
  await initSchema(db);
  expect(statements(db).some((s) => /own_reading_seconds/.test(s) && /ALTER/.test(s))).toBe(false);
});

// Killed between the two ALTERs, the first check found its column and the
// second was never added — and every activity write failed from then on.
it("adds the second column to a database that only got the first", async () => {
  const db = fakeDb(["date", "own_reading_seconds"]);
  await initSchema(db);
  const sql = statements(db);
  expect(sql.some((s) => /ADD COLUMN own_listening_seconds/.test(s))).toBe(true);
  expect(sql.some((s) => /ADD COLUMN own_reading_seconds/.test(s))).toBe(false);
});
