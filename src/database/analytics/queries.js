import { logError, logMessage } from "@common";
import { getAnalyticsDB } from "./connect";
import { runSerialized } from "./queue";

// Serialized (see queue.js) — the Dashboard mounts many independent reads at
// once, and react-native-sqlite-storage's native bridge isn't safe under that
// much concurrency.
const runQuery = (sql, params = []) =>
  runSerialized(async () => {
    try {
      const db = await getAnalyticsDB();
      const [result] = await db.executeSql(sql, params);
      return result;
    } catch (err) {
      logMessage(`analytics_db_write_failed: ${err?.message || err}`);
      logError(new Error(`Analytics query error: ${err?.message || err} | SQL: ${sql}`));
      throw err;
    }
  });

// Insert-or-update without `ON CONFLICT … DO UPDATE`: that syntax needs SQLite
// 3.24, and Android uses the OS's own SQLite — Android 9 ships 3.22, Android 7
// (our floor) 3.9 — so on those phones an upsert was a syntax error on every
// call and the row was never written. UPDATE first, INSERT only when nothing
// was there. One serialized task, so no other writer can slip in between.
const upsertRow = (update, insert) =>
  runSerialized(async () => {
    const db = await getAnalyticsDB();
    try {
      const [updated] = await db.executeSql(update.sql, update.params);
      if ((updated?.rowsAffected ?? 0) > 0) return updated;
      const [inserted] = await db.executeSql(insert.sql, insert.params);
      return inserted;
    } catch (err) {
      logMessage(`analytics_db_write_failed: ${err?.message || err}`);
      logError(new Error(`Analytics upsert error: ${err?.message || err} | SQL: ${update.sql}`));
      throw err;
    }
  });

const rowsToArray = (result) => {
  const rows = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

// ─── Read sessions ────────────────────────────────────────────────────────────

export const insertReadSession = async ({
  bani_id,
  bani_title,
  start_time,
  end_time,
  duration_seconds,
  completed,
}) => {
  return runQuery(
    `INSERT INTO bani_read_history (bani_id, bani_title, start_time, end_time, duration_seconds, completed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [bani_id, bani_title ?? null, start_time, end_time, duration_seconds, completed ? 1 : 0]
  );
};

export const getUnsyncedReadSessions = async () => {
  const result = await runQuery(`SELECT * FROM bani_read_history WHERE sync_status = 0 LIMIT 100`);
  return rowsToArray(result);
};

// Every row, not just the unsynced ones — used to carry a signed-out store
// into the account that claims it, which needs the whole table.
export const getAllReadSessions = async () => {
  const result = await runQuery(`SELECT * FROM bani_read_history ORDER BY start_time ASC`);
  return rowsToArray(result);
};

export const getTopReadBanis = async (limit = 5) => {
  const result = await runQuery(
    `SELECT bani_id, bani_title,
            COUNT(*) as session_count,
            SUM(duration_seconds) as total_seconds
     FROM bani_read_history
     GROUP BY bani_id
     ORDER BY total_seconds DESC
     LIMIT ?`,
    [limit]
  );
  return rowsToArray(result);
};

export const getRecentReadBanis = async (limit = 5) => {
  const result = await runQuery(
    `SELECT bani_id, bani_title, start_time as last_time, duration_seconds as total_seconds
     FROM bani_read_history
     ORDER BY start_time DESC
     LIMIT ?`,
    [limit]
  );
  return rowsToArray(result);
};

// ─── Audio sessions ───────────────────────────────────────────────────────────

export const insertAudioSession = async ({
  audio_id,
  bani_id,
  bani_title,
  artist_id,
  artist_name,
  duration_played,
  completed,
}) => {
  return runQuery(
    `INSERT INTO audio_history (audio_id, bani_id, bani_title, artist_id, artist_name, duration_played, completed)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      audio_id ?? null,
      bani_id,
      bani_title ?? null,
      artist_id ?? null,
      artist_name ?? null,
      duration_played,
      completed ? 1 : 0,
    ]
  );
};

export const getUnsyncedAudioSessions = async () => {
  const result = await runQuery(`SELECT * FROM audio_history WHERE sync_status = 0 LIMIT 100`);
  return rowsToArray(result);
};

export const getAllAudioSessions = async () => {
  const result = await runQuery(`SELECT * FROM audio_history ORDER BY created_at ASC`);
  return rowsToArray(result);
};

export const getTopListenedBanis = async (limit = 5) => {
  const result = await runQuery(
    `SELECT bani_id, bani_title,
            MAX(artist_id) as artist_id,
            MAX(artist_name) as artist_name,
            COUNT(*) as session_count,
            SUM(duration_played) as total_seconds
     FROM audio_history
     GROUP BY bani_id
     ORDER BY total_seconds DESC
     LIMIT ?`,
    [limit]
  );
  return rowsToArray(result);
};

export const getRecentListenedBanis = async (limit = 5) => {
  const result = await runQuery(
    `SELECT bani_id, bani_title, artist_name, created_at as last_time, duration_played as total_seconds
     FROM audio_history
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rowsToArray(result);
};

// ─── Daily activity ───────────────────────────────────────────────────────────

export const upsertDailyActivity = async ({
  date,
  reading_seconds_delta = 0,
  listening_seconds_delta = 0,
}) => {
  const reading = reading_seconds_delta;
  const listening = listening_seconds_delta;
  const total = reading + listening;
  return upsertRow(
    {
      sql: `UPDATE daily_activity SET
              reading_seconds   = reading_seconds   + ?,
              listening_seconds = listening_seconds + ?,
              total_seconds     = total_seconds     + ?,
              updated_at        = strftime('%s','now')
            WHERE date = ?`,
      params: [reading, listening, total, date],
    },
    {
      sql: `INSERT INTO daily_activity (date, reading_seconds, listening_seconds, total_seconds, updated_at)
            VALUES (?, ?, ?, ?, strftime('%s','now'))`,
      params: [date, reading, listening, total],
    }
  );
};

// Overwrites (not accumulates) a day's totals — for restoring a cloud snapshot,
// where the incoming numbers are already the day's true total, not a delta.
// Using the additive upsertDailyActivity here would double-count on a second
// restore of the same day (e.g. a repeat reinstall before the next cloud push).
//
// `updatedAt: 0` marks a row written from the ACCOUNT's summed activity rather
// than by this device. getActivityUpdatedSince never returns such a row, so
// the account's total can never be sent back up as this device's own work —
// which would have every other device's minutes counted twice, and doubled
// again on every pull after that.
export const setDailyActivity = async ({
  date,
  reading_seconds = 0,
  listening_seconds = 0,
  updatedAt = null,
}) => {
  const reading = reading_seconds;
  const listening = listening_seconds;
  const total = reading + listening;
  return upsertRow(
    {
      sql: `UPDATE daily_activity SET
              reading_seconds   = ?,
              listening_seconds = ?,
              total_seconds     = ?,
              updated_at        = COALESCE(?, strftime('%s','now'))
            WHERE date = ?`,
      params: [reading, listening, total, updatedAt, date],
    },
    {
      sql: `INSERT INTO daily_activity (date, reading_seconds, listening_seconds, total_seconds, updated_at)
            VALUES (?, ?, ?, ?, COALESCE(?, strftime('%s','now')))`,
      params: [date, reading, listening, total, updatedAt],
    }
  );
};

// Every day row in this store, oldest first. Used to carry signed-out activity
// into the account that signs in next — that needs the whole table, not one
// month of it.
export const getAllDailyActivity = async () => {
  const result = await runQuery(`SELECT * FROM daily_activity ORDER BY date ASC`);
  return rowsToArray(result);
};

// Empties the day table of THIS store only. Used on the anonymous store once
// its rows have been added to an account, so a later sign-in cannot add them a
// second time. Deliberately not a "clear my data" — it takes no other table.
export const clearDailyActivity = async () => {
  return runQuery(`DELETE FROM daily_activity`);
};

export const getDayActivity = async (date) => {
  const result = await runQuery(`SELECT * FROM daily_activity WHERE date = ? LIMIT 1`, [date]);
  const rows = rowsToArray(result);
  return rows[0] ?? null;
};

// Every date that met the streak bar, newest first. The streak engine walks
// this list instead of the stored counter, so one query replaces one-query-per-
// day-walked-backwards; even a multi-year daily reader is a few hundred short
// strings, and non-qualifying days never leave SQLite.
/**
 * The newest day with ANY activity recorded, or null when the table is empty.
 *
 * Distinct from `getQualifyingDates`, which answers a different question — the
 * days long enough to count as practice. This one is "how far does the history
 * reach", which is what tells a short day apart from a missing one.
 */
export const getLatestActivityDate = async () => {
  const result = await runQuery(
    `SELECT date FROM daily_activity
       WHERE (reading_seconds + listening_seconds) > 0
       ORDER BY date DESC LIMIT 1`
  );
  return rowsToArray(result)[0]?.date ?? null;
};

export const getQualifyingDates = async (minActiveSeconds) => {
  const result = await runQuery(
    // Sums the two columns rather than reading `total_seconds`, so the rule
    // cannot be thrown off if that denormalized column ever drifts.
    //
    // CAST(? AS INTEGER) is load-bearing, not defensive. `reading_seconds >= ?`
    // worked because a COLUMN carries INTEGER affinity, which makes SQLite
    // coerce the bound parameter to a number. `(a + b)` is an EXPRESSION and has
    // NO affinity, so no coercion happens — and if the bridge hands the value
    // over as text, every numeric value sorts before every text value, so the
    // comparison is false for every row and the query silently returns nothing.
    // That is precisely what it did: a 344-second day never matched 240.
    `SELECT date FROM daily_activity
     WHERE (reading_seconds + listening_seconds) >= CAST(? AS INTEGER)
     ORDER BY date DESC`,
    [minActiveSeconds]
  );
  return rowsToArray(result).map((r) => r.date);
};

export const getDailyActivity = async (year, month) => {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const result = await runQuery(
    `SELECT * FROM daily_activity WHERE date LIKE ? ORDER BY date ASC`,
    [`${prefix}%`]
  );
  return rowsToArray(result);
};

// Days whose totals have changed since a given moment — the delta the per-date
// sync endpoint wants.
//
// `updated_at` rather than the `sync_status` flag the table also carries: the
// flag needs a matching write to clear it, and `daily_activity` is keyed on
// `date` with no `id`, so `markSynced` (which clears by id) cannot address it.
// A timestamp watermark needs no write-back at all, and the endpoint replaces
// rather than accumulates, so re-sending a day is free.
//
// `updated_at = 0` rows are the account's summed days written back by a pull
// (see setDailyActivity) and are never this device's to send, whatever the
// watermark says — a watermark of 0 must not sweep them up either.
export const getActivityUpdatedSince = async (unixSeconds) => {
  const result = await runQuery(
    `SELECT * FROM daily_activity
       WHERE updated_at > 0 AND updated_at >= ?
       ORDER BY date ASC LIMIT 400`,
    [Math.floor(unixSeconds)]
  );
  return rowsToArray(result);
};

export const getUnsyncedActivity = async () => {
  const result = await runQuery(`SELECT * FROM daily_activity WHERE sync_status = 0 LIMIT 100`);
  return rowsToArray(result);
};

// ─── User stats summary ───────────────────────────────────────────────────────

export const getOrCreateSummary = async () => {
  const result = await runQuery(`SELECT * FROM user_stats_summary WHERE id = 1`);
  const rows = rowsToArray(result);
  return rows[0] ?? null;
};

export const updateSummary = async (fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => fields[k]);
  return runQuery(
    `UPDATE user_stats_summary SET ${setClauses}, updated_at = strftime('%s','now') WHERE id = 1`,
    values
  );
};

// ─── Computed totals (live from raw tables) ───────────────────────────────────

export const getReadingListeningTotals = async () => {
  const result = await runQuery(
    `SELECT
      COALESCE((SELECT SUM(duration_seconds) FROM bani_read_history), 0) AS total_reading_seconds,
      COALESCE((SELECT SUM(duration_played)  FROM audio_history),        0) AS total_listening_seconds,
      COALESCE((SELECT COUNT(*)              FROM audio_history),        0) AS total_audio_sessions`
  );
  const rows = rowsToArray(result);
  return (
    rows[0] ?? { total_reading_seconds: 0, total_listening_seconds: 0, total_audio_sessions: 0 }
  );
};

// All-time reading/listening sum straight from the daily aggregate table —
// used as a floor against getAllTimeTotals' baseline+live figures below.
// daily_activity is kept consistent by both real sessions (upsertDailyActivity,
// additive) and restores (setDailyActivity), so it can end up ahead of the
// frozen baseline if the two ever drift (e.g. a partial cloud repair that only
// touches summary totals without touching that snapshot's day-by-day
// breakdown, as happened once this session) — never report less than what
// the daily breakdown itself already shows.
export const getDailyActivityTotals = async () => {
  const result = await runQuery(
    `SELECT
      COALESCE(SUM(reading_seconds), 0)   AS total_reading_seconds,
      COALESCE(SUM(listening_seconds), 0) AS total_listening_seconds
     FROM daily_activity`
  );
  const rows = rowsToArray(result);
  return rows[0] ?? { total_reading_seconds: 0, total_listening_seconds: 0 };
};

// Reading/listening seconds for a single year, scoped by the daily_activity date
// prefix (YYYY). Dates are written in the user's LOCAL time (see the session
// hooks), so `${new Date().getFullYear()}` gives a total that resets at the
// user's local New Year. There is no all-time baseline here on purpose — the
// frozen summary baseline is not year-decomposable, so the per-year figure comes
// straight from the day-by-day breakdown.
export const getYearActivityTotals = async (year) => {
  const result = await runQuery(
    `SELECT
      COALESCE(SUM(reading_seconds), 0)   AS total_reading_seconds,
      COALESCE(SUM(listening_seconds), 0) AS total_listening_seconds
     FROM daily_activity WHERE date LIKE ?`,
    [`${year}-%`]
  );
  const rows = rowsToArray(result);
  return rows[0] ?? { total_reading_seconds: 0, total_listening_seconds: 0 };
};

// ─── Privacy ──────────────────────────────────────────────────────────────────

export const clearAllAnalyticsData = async () => {
  // bani_read_counts was missed here originally. It survived a "clear my data"
  // and therefore also survived an account switch, so the next person saw the
  // previous one's most-read banis.
  await runQuery("DELETE FROM bani_read_counts");
  await runQuery("DELETE FROM bani_read_history");
  await runQuery("DELETE FROM audio_history");
  await runQuery("DELETE FROM daily_activity");
  await runQuery(
    `UPDATE user_stats_summary SET
      current_streak=0, longest_streak=0, total_days_active=0,
      total_reading_seconds=0, total_listening_seconds=0,
      total_banis_read=0, total_audio_sessions=0,
      last_active_date=NULL,
      updated_at=strftime('%s','now')
     WHERE id=1`
  );
};

// ─── Day detail ──────────────────────────────────────────────────────────────

export const getDayDetail = async (dateStr) => {
  const [readResult, listenResult] = await Promise.all([
    // start_time is stored as Date.now() → milliseconds; divide by 1000 for 'unixepoch'.
    // MAX(completed) acts as an OR across a bani's sessions that day — 1 if any
    // single session crossed the 95%-scrolled completion mark, matching
    // useReadingSession's per-session `completed` flag.
    runQuery(
      // completed_at is the newest session that actually crossed 95%. Without
      // it a caller cannot tell "this bani was read at some point today" from
      // "this bani was read again just now", which is the difference between
      // re-reporting an old read and recording a new one.
      `SELECT bani_id, bani_title, SUM(duration_seconds) as duration, MAX(completed) as completed,
              MAX(CASE WHEN completed = 1 THEN start_time END) as completed_at
       FROM bani_read_history
       WHERE date(start_time / 1000, 'unixepoch', 'localtime') = ?
       GROUP BY bani_id
       ORDER BY duration DESC`,
      [dateStr]
    ),
    // created_at is strftime('%s','now') → seconds; no division needed
    runQuery(
      `SELECT bani_id, bani_title, SUM(duration_played) as duration
       FROM audio_history
       WHERE date(created_at, 'unixepoch', 'localtime') = ?
       GROUP BY bani_id
       ORDER BY duration DESC`,
      [dateStr]
    ),
  ]);
  return {
    reads: rowsToArray(readResult),
    listens: rowsToArray(listenResult),
  };
};

// ─── Per-bani read counter ────────────────────────────────────────────────────

export const incrementBaniReadCount = async (baniId, baniTitle) => {
  if (!baniId) return;
  const today = new Date().toISOString().slice(0, 10);
  return upsertRow(
    {
      sql: `UPDATE bani_read_counts SET
              read_count = read_count + 1,
              bani_title = ?,
              last_read  = ?
            WHERE bani_id = ?`,
      params: [baniTitle ?? null, today, baniId],
    },
    {
      sql: `INSERT INTO bani_read_counts (bani_id, bani_title, read_count, last_read)
            VALUES (?, ?, 1, ?)`,
      params: [baniId, baniTitle ?? null, today],
    }
  );
};

export const getBaniReadCount = async (baniId) => {
  const result = await runQuery(
    `SELECT read_count FROM bani_read_counts WHERE bani_id = ? LIMIT 1`,
    [baniId]
  );
  const rows = rowsToArray(result);
  return rows[0]?.read_count ?? 0;
};

export const getAllBaniReadCounts = async () => {
  const result = await runQuery(
    `SELECT bani_id, bani_title, read_count, last_read
     FROM bani_read_counts
     ORDER BY read_count DESC`
  );
  return rowsToArray(result);
};

// ─── Completed banis ───────────────────────────────────────────────────────────

// Counts reading sessions marked completed — `completed` is set by
// useReadingSession based on scroll position (>=95% through the bani),
// not time spent, so this reflects sessions the reader actually finished.
export const getCompletedBanisCount = async () => {
  const result = await runQuery(
    `SELECT COUNT(*) as cnt FROM bani_read_history WHERE completed = 1`
  );
  const rows = rowsToArray(result);
  return rows[0]?.cnt ?? 0;
};

// ─── All-time totals (restore baseline + live, survives reinstall) ───────────
// A fresh install's raw tables (bani_read_history/audio_history) are always
// empty — they're never restored from a cloud snapshot (there's no per-session
// history in it, only aggregates). So "all-time" = the baseline captured once
// at restore time (user_stats_summary.total_*, untouched afterward) + whatever
// this install has actually recorded since. Use this instead of the raw live
// queries directly wherever a stat is presented/synced as "all time".
//
// readingSeconds/listeningSeconds additionally floor against
// getDailyActivityTotals() (see its own comment) — the baseline+live figure
// can under-report if it and daily_activity ever drift apart, and taking the
// max means we're always at least as high as the more granular source,
// without needing to fully replace the baseline approach (which is still the
// more complete source across a reinstall that only restores one month's
// day-by-day breakdown).
//
// The BASELINE half lives in user_stats_summary.total_*; the LIVE half is
// recounted from the raw tables on every call. Keeping the two separable is
// what `raiseAllTimeBaseline` below needs, so both come out of one place.
const allTimeParts = async () => {
  const [summary, live, liveBanisCompleted, dailyTotals] = await Promise.all([
    getOrCreateSummary(),
    getReadingListeningTotals(),
    getCompletedBanisCount(),
    getDailyActivityTotals(),
  ]);
  const liveParts = {
    banisCompleted: liveBanisCompleted,
    readingSeconds: live.total_reading_seconds,
    listeningSeconds: live.total_listening_seconds,
    audioSessions: live.total_audio_sessions,
  };
  const baseline = {
    banisCompleted: summary?.total_banis_read ?? 0,
    readingSeconds: summary?.total_reading_seconds ?? 0,
    listeningSeconds: summary?.total_listening_seconds ?? 0,
    audioSessions: summary?.total_audio_sessions ?? 0,
  };
  return {
    live: liveParts,
    baseline,
    totals: {
      banisCompleted: baseline.banisCompleted + liveParts.banisCompleted,
      readingSeconds: Math.max(
        baseline.readingSeconds + liveParts.readingSeconds,
        dailyTotals.total_reading_seconds
      ),
      listeningSeconds: Math.max(
        baseline.listeningSeconds + liveParts.listeningSeconds,
        dailyTotals.total_listening_seconds
      ),
      audioSessions: baseline.audioSessions + liveParts.audioSessions,
    },
  };
};

export const getAllTimeTotals = async () => (await allTimeParts()).totals;

// Column each all-time figure is stored in. Only these four have a live half;
// current_streak/longest_streak/total_days_active have none, so they are plain
// summary fields and a restore may write them directly.
const BASELINE_COLUMNS = {
  banisCompleted: "total_banis_read",
  readingSeconds: "total_reading_seconds",
  listeningSeconds: "total_listening_seconds",
  audioSessions: "total_audio_sessions",
};

// Raises the frozen baseline so the REPORTED all-time totals are at least the
// figures a cloud snapshot carries — without re-counting this install's own
// sessions.
//
// The distinction matters because the two are different quantities that were
// being conflated. What a snapshot carries is a REPORTED total: the device that
// pushed it had already added its own live rows in. Writing that number back
// into the baseline column, which is then added to THIS device's live rows
// again, ratchets the figure upward by the live count on every single refresh.
// That is the "bani count goes up by one every time I pull to refresh" report:
// one completed bani on this install, one extra bani counted per pull, forever,
// and none at all on a device with no live sessions of its own.
//
// So solve for the baseline instead of assigning to it. The target is what we
// want the user to SEE — the larger of what we already show and what the cloud
// says — and the baseline is whatever makes the sum come out there:
//
//     shown  = baseline + live        (what getAllTimeTotals returns)
//     target = max(shown, incoming)   (monotonic: a stale snapshot cannot
//                                      drag a real number down)
//     baseline := target - live
//
// which is idempotent: run it twice with the same snapshot and the second pass
// computes the same baseline, because `shown` already equals `target`.
export const raiseAllTimeBaseline = async (incoming = {}) => {
  const { live, totals } = await allTimeParts();
  const fields = {};
  Object.keys(BASELINE_COLUMNS).forEach((key) => {
    if (incoming[key] == null) return;
    const target = Math.max(Number(incoming[key]) || 0, totals[key]);
    fields[BASELINE_COLUMNS[key]] = Math.max(0, target - live[key]);
  });
  if (Object.keys(fields).length) await updateSummary(fields);
  return fields;
};

// ─── Sync helpers ─────────────────────────────────────────────────────────────

export const markSynced = async (table, ids) => {
  if (!ids || ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(",");
  return runQuery(`UPDATE ${table} SET sync_status = 1 WHERE id IN (${placeholders})`, ids);
};
