const CREATE_BANI_READ_HISTORY = `
  CREATE TABLE IF NOT EXISTS bani_read_history (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    bani_id          INTEGER NOT NULL,
    bani_title       TEXT,
    start_time       INTEGER NOT NULL,
    end_time         INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    completed        INTEGER NOT NULL DEFAULT 0,
    sync_status      INTEGER NOT NULL DEFAULT 0,
    created_at       INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
`;

const CREATE_AUDIO_HISTORY = `
  CREATE TABLE IF NOT EXISTS audio_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    audio_id        TEXT,
    bani_id         INTEGER NOT NULL,
    bani_title      TEXT,
    artist_id       TEXT,
    duration_played INTEGER NOT NULL DEFAULT 0,
    completed       INTEGER NOT NULL DEFAULT 0,
    sync_status     INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
`;

const CREATE_DAILY_ACTIVITY = `
  CREATE TABLE IF NOT EXISTS daily_activity (
    date                  TEXT PRIMARY KEY,
    reading_seconds       INTEGER NOT NULL DEFAULT 0,
    listening_seconds     INTEGER NOT NULL DEFAULT 0,
    total_seconds         INTEGER NOT NULL DEFAULT 0,
    own_reading_seconds   INTEGER NOT NULL DEFAULT 0,
    own_listening_seconds INTEGER NOT NULL DEFAULT 0,
    sync_status           INTEGER NOT NULL DEFAULT 0,
    updated_at            INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
`;

const CREATE_USER_STATS_SUMMARY = `
  CREATE TABLE IF NOT EXISTS user_stats_summary (
    id                       INTEGER PRIMARY KEY DEFAULT 1,
    current_streak           INTEGER NOT NULL DEFAULT 0,
    longest_streak           INTEGER NOT NULL DEFAULT 0,
    total_days_active        INTEGER NOT NULL DEFAULT 0,
    total_reading_seconds    INTEGER NOT NULL DEFAULT 0,
    total_listening_seconds  INTEGER NOT NULL DEFAULT 0,
    total_banis_read         INTEGER NOT NULL DEFAULT 0,
    total_audio_sessions     INTEGER NOT NULL DEFAULT 0,
    last_active_date         TEXT,
    updated_at               INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
`;

const SEED_USER_STATS_SUMMARY = `
  INSERT OR IGNORE INTO user_stats_summary (id) VALUES (1);
`;

const CREATE_BANI_READ_COUNTS = `
  CREATE TABLE IF NOT EXISTS bani_read_counts (
    bani_id    INTEGER PRIMARY KEY,
    bani_title TEXT,
    read_count INTEGER NOT NULL DEFAULT 0,
    last_read  TEXT
  );
`;

const hasColumn = async (db, table, column) => {
  const [info] = await db.executeSql(`PRAGMA table_info(${table})`);
  for (let i = 0; i < info.rows.length; i += 1) {
    if (info.rows.item(i).name === column) return true;
  }
  return false;
};

// Named: connect.js and the tests import it by name.
// eslint-disable-next-line import/prefer-default-export
export const initSchema = async (db) => {
  await db.executeSql(CREATE_BANI_READ_HISTORY);
  await db.executeSql(CREATE_AUDIO_HISTORY);
  await db.executeSql(CREATE_DAILY_ACTIVITY);
  await db.executeSql(CREATE_USER_STATS_SUMMARY);
  await db.executeSql(CREATE_BANI_READ_COUNTS);
  await db.executeSql(SEED_USER_STATS_SUMMARY);
  // Migration: add artist_name column if upgrading from an older install.
  // Check the column first via PRAGMA so we don't fire an ALTER that the native
  // SQLite layer logs as an error on every launch once the column exists.
  try {
    if (!(await hasColumn(db, "audio_history", "artist_name"))) {
      await db.executeSql(`ALTER TABLE audio_history ADD COLUMN artist_name TEXT`);
    }
  } catch (_) {
    // Non-fatal: the column is also created on fresh installs via newer schema.
  }
  // Migration: this device's OWN seconds per day, apart from the totals. The
  // totals take the account's figures on a pull, so pushing them sent every
  // other device's minutes back up as this device's.
  //
  // A row's total is not proof of what this device did: the previous release
  // raised a day to another device's figure and kept this device's stamp on
  // it. So the seed is what this device's own sessions recorded that day, and
  // never more than the total. An account-written row (updated_at = 0) seeds
  // 0. A sitting across midnight is filed under the day it began; the cap keeps
  // that from ever counting a day for more than it holds.
  try {
    // Each column on its own: killed between the two, a single check found the
    // first and never added the second, and every write after that failed.
    const addReading = !(await hasColumn(db, "daily_activity", "own_reading_seconds"));
    const addListening = !(await hasColumn(db, "daily_activity", "own_listening_seconds"));
    if (addReading) {
      await db.executeSql(
        `ALTER TABLE daily_activity ADD COLUMN own_reading_seconds INTEGER NOT NULL DEFAULT 0`
      );
    }
    if (addListening) {
      await db.executeSql(
        `ALTER TABLE daily_activity ADD COLUMN own_listening_seconds INTEGER NOT NULL DEFAULT 0`
      );
    }
    if (addReading || addListening) {
      await db.executeSql(
        `UPDATE daily_activity
            SET own_reading_seconds = MIN(reading_seconds, COALESCE((
                  SELECT SUM(h.duration_seconds) FROM bani_read_history h
                   WHERE date(h.start_time / 1000, 'unixepoch', 'localtime') = daily_activity.date
                ), 0)),
                own_listening_seconds = MIN(listening_seconds, COALESCE((
                  SELECT SUM(a.duration_played) FROM audio_history a
                   WHERE date(a.created_at, 'unixepoch', 'localtime') = daily_activity.date
                ), 0))
          WHERE updated_at > 0`
      );
    }
  } catch (err) {
    // Not swallowed: without the columns every activity push would fail.
    throw new Error(`analytics schema: own-seconds migration failed: ${err?.message || err}`);
  }
};
