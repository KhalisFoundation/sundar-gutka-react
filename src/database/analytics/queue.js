// Serializes every analytics DB call (reads and writes) through one queue.
// react-native-sqlite-storage's native bridge can throw "Malformed calls from
// JS: field sizes are different" when several executeSql calls land in the
// same batch tick — the Dashboard mounts ~15 independent queries at once
// (StreakCard, MonthCalendar, YourPractice, WeekChart, computeStreaks...), so
// this isn't rare. Running them one at a time removes the race entirely,
// regardless of the exact native-side cause.
let _chain = Promise.resolve();

// A wedged native call (e.g. the SQLite bridge left in a bad state after a
// prior crash — the native module survives a JS-only reload) would otherwise
// hang every query queued behind it forever, since they all share this one
// chain. Time each task out so one bad call degrades to an error instead of
// freezing the whole Dashboard.
const QUERY_TIMEOUT_MS = 8000;
const withTimeout = (promise) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Analytics DB call timed out after ${QUERY_TIMEOUT_MS}ms`)),
      QUERY_TIMEOUT_MS
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });

export const runSerialized = (fn) => {
  const result = _chain.then(() => withTimeout(fn()));
  // Keep the chain alive even after a failure/timeout, but don't let one
  // caller's rejection propagate to the next queued caller.
  _chain = result.then(
    () => {},
    () => {}
  );
  return result;
};

// Fire-and-forget write queue for analytics DB operations.
// Callers push a () => Promise and return instantly — no await needed at the call site.
// Deliberately NOT wrapped in runSerialized: every caller's fn() body itself calls
// analytics functions (insertReadSession, upsertDailyActivity, ...) that already
// serialize themselves through runQuery. Adding another runSerialized layer here
// would deadlock — this call claims a chain slot and then awaits (via fn()) the
// very calls queued behind that same slot, so it can never resolve until its own
// 8s timeout fires. Firing fn() directly still runs its inner calls in order
// (they're issued synchronously in the same tick), with no extra wrapping needed.
export const enqueueAnalyticsWrite = (fn) => {
  fn().catch(() => {});
};
