import { Platform } from "react-native";
import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import { constant, logError, logMessage, ensureDbExists, LOCAL_DB_PATH } from "@common";

// Enable promise-based APIs
enablePromise(true);

// ─── In-place data migrations for the shipped bani DB ──────────────────────────
// The version the CURRENT app build's bundled DB is shipped at. Bump this (and
// add a matching `if (version < N)` block below) whenever a content row in the
// shipped DB is corrected. The bundled .db files are set to this same
// user_version, so a FRESH install skips the migration (it already has the fix).
//
// Why in-place UPDATEs instead of re-shipping the DB: bookmarks (Banis_Bookmarks)
// live in the SAME gutka_v01.db as the content, and ensureDbExists() only
// re-copies the bundled DB when its .md5 sidecar changes — a re-copy would
// overwrite the user's bookmarks. So for users seeded from an older bundled DB
// we leave their file in place and patch just the corrected rows here, gated by
// PRAGMA user_version (stored in the DB header, survives because we never
// re-copy). Every migration must be idempotent.
const LATEST_DB_VERSION = 1;

const runMigrations = async (db) => {
  const [res] = await db.executeSql("PRAGMA user_version");
  const version = res.rows.item(0).user_version ?? 0;
  if (version >= LATEST_DB_VERSION) return;

  // v1 — Baarah Maaha title header (Bani 28, Seq 1). The content row shipped as
  // "ਬਾਰਹ ਮਾਹ" (maah); the correct title, matching the Banis menu name, is
  // "ਬਾਰਹ ਮਾਹਾ" (maaha). Both the legacy-ASCII (Gurmukhi, used by the default
  // GurbaniAkhar font) and Unicode (GurmukhiUni, used by Baloo) forms are fixed
  // so the correction shows regardless of the selected font.
  if (version < 1) {
    await db.executeSql(
      `UPDATE mv_Banis_Shabad
         SET Gurmukhi = 'bwrh mwhw ]', GurmukhiUni = 'ਬਾਰਹ ਮਾਹਾ ॥'
       WHERE Bani = 28 AND Seq = 1 AND header = 1`
    );
  }

  // PRAGMA can't bind its value, so interpolate the hardcoded integer constant.
  await db.executeSql(`PRAGMA user_version = ${LATEST_DB_VERSION}`);
  logMessage(`Bani DB migrated to version ${LATEST_DB_VERSION}.`);
};

// Where the bani DB lives and how it is opened — ONE definition, used by the
// first attempt and by the retry below. They used to differ: the retry opened
// `constant.DB` with no extension and no location, which is neither the file
// ensureDbExists seeds nor the one the first attempt opens. On iOS that meant
// a seeding hiccup was answered with a brand-new, EMPTY database, cached for
// the session — an app with no banis in it, and a blank list with nothing to
// tap, on every launch afterwards.
const openOptions = () => ({
  name: Platform.OS === "android" ? LOCAL_DB_PATH : `${constant.DB}.db`,
  location: "Documents",
  // The plugin's own copy of `www/<name>` out of the app bundle. It is the
  // safety net for exactly the case the retry handles: seeding failed, so let
  // SQLite seed itself from the same bundled file.
  createFromLocation: 1,
});

// Singletons
const databaseInstance = { value: null };
let initializingPromise = null;

const initDB = async () => {
  if (databaseInstance.value) {
    return databaseInstance.value;
  }
  if (initializingPromise) {
    return initializingPromise;
  }

  // The seed runs INSIDE the deduped promise. It used to run before the
  // singleton checks, so every concurrent first caller ran its own
  // ensureDbExists — on a fresh install that meant the multi-second bundled-DB
  // copy ran twice, racing itself over the same file (measured on device: two
  // full copies side by side). Once the handle exists there is nothing left to
  // seed, so later callers skip the check entirely.
  initializingPromise = ensureDbExists()
    .then(() => openDatabase(openOptions()))
    .then(async (db) => {
      databaseInstance.value = db;
      initializingPromise = null;
      // Best-effort: a migration failure must never block app launch. Leaving
      // user_version un-bumped means it simply retries on the next launch.
      try {
        await runMigrations(db);
      } catch (mErr) {
        logError(new Error(`Bani DB migration failed: ${mErr?.message || mErr}`));
      }
      return db;
    })
    .catch((err) => {
      logMessage("Opening database error");
      logError(err);
      openDatabase(openOptions())
        .then((db) => {
          databaseInstance.value = db;
        })
        .catch((error) => {
          // Logged only. FallBack is the error-boundary SCREEN; calling a
          // component as a plain function runs its hooks outside React's render,
          // so this catch threw "Invalid hook call" over the failure it was
          // reporting — and this one fires when the DATABASE will not open, the
          // fault most worth seeing.
          logError("Error opening fallback database", error);
          logError(error);
        });
      initializingPromise = null;
      throw err;
    });

  return initializingPromise;
};

export const closeDatabase = async () => {
  if (databaseInstance.value) {
    await databaseInstance.value.close();
    databaseInstance.value = null;
  }
};

export default initDB;
