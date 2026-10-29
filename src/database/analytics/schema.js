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
    const [info] = await db.executeSql(`PRAGMA table_info(audio_history)`);
    let hasArtistName = false;
    for (let i = 0; i < info.rows.length; i += 1) {
      if (info.rows.item(i).name === "artist_name") {
        hasArtistName = true;
        break;
      }
    }
    if (!hasArtistName) {
      await db.executeSql(`ALTER TABLE audio_history ADD COLUMN artist_name TEXT`);
    }
  } catch (_) {
    // Non-fatal: the column is also created on fresh installs via newer schema.
  }
};
