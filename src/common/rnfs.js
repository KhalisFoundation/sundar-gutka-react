import { Platform } from "react-native";
import {
  readDir,
  DocumentDirectoryPath,
  MainBundlePath,
  readFile,
  readFileAssets,
  writeFile,
  exists,
  copyFile,
  copyFileAssets,
  unlink,
  moveFile,
  stat,
  hash as fileHash,
} from "react-native-fs";
import { constant, logError, logMessage } from "@common";

// Paths and URLs
const BUNDLED_DB_PATH = `${MainBundlePath}/www/${constant.DB}.db`;
const BUNDLED_MD5_PATH = `${MainBundlePath}/www/${constant.DB}.md5`;
// Asset-relative paths (Android reads these straight out of the APK assets).
const ASSET_DB_PATH = `www/${constant.DB}.db`;
const ASSET_MD5_PATH = `www/${constant.DB}.md5`;
export const LOCAL_DB_PATH = `${DocumentDirectoryPath}/${constant.DB}.db`;
const LOCAL_MD5_PATH = `${DocumentDirectoryPath}/${constant.DB}.md5`;
// Records the MD5 of the DB bundled in the app build that we last seeded onto
// the device. Distinct from LOCAL_MD5_PATH (which tracks the *live* on-device
// DB, and is rewritten by the remote-update flow) so that a user-applied remote
// DB update is never clobbered on launch — only a genuinely newer *bundled* DB
// (i.e. a new app version) triggers a refresh.
const BUNDLED_MARKER_PATH = `${DocumentDirectoryPath}/${constant.DB}.bundled.md5`;
const REMOTE_MD5_URL = `${constant.REMOTE_DB_URL}/${constant.DB}.md5`;
export const REMOTE_DB_URL = `${constant.REMOTE_DB_URL}/${constant.DB}.db`;

export const listDocumentDirectory = async () => {
  try {
    const files = await readDir(DocumentDirectoryPath);
    return files;
  } catch (error) {
    logError("Error in listDocumentDirectory:", error);
    return [];
  }
};

// Read the MD5 of the DB bundled in the current app build (APK assets on
// Android, app bundle on iOS). Returns null if it can't be read.
const readBundledMD5Hash = async () => {
  try {
    const raw =
      Platform.OS === "android"
        ? await readFileAssets(ASSET_MD5_PATH)
        : await readFile(BUNDLED_MD5_PATH);
    return raw.trim();
  } catch (err) {
    logError(`readBundledMD5Hash error: ${err.message}`);
    return null;
  }
};

// Read a trimmed hash file, or null if it's missing/unreadable.
const readHashFile = async (path) => {
  try {
    if (!(await exists(path))) return null;
    return (await readFile(path)).trim();
  } catch (err) {
    logError(`readHashFile error (${path}): ${err.message}`);
    return null;
  }
};

// Copy the bundled DB (and its checksum) onto the device, and record which
// bundled build we seeded so we don't re-copy it on every launch.
/**
 * Copy over whatever is there, on both platforms.
 *
 * iOS `copyFile` is NSFileManager's `copyItemAtPath:`, which FAILS when the
 * destination already exists; Android's `copyFileAssets` overwrites. So the
 * SECOND seed — an app update shipping a newer bundled DB — threw on iOS
 * only, and the throw took initDB down its fallback path, which opened a
 * different, empty database. Every query then failed with "no such table",
 * which is an empty bani list with nothing on it to tap. The marker is
 * written last, so the copy simply retried and failed the same way on every
 * later launch.
 */
//
// The new file is copied to a staging path first and only swapped in once the
// copy has completed (and, for the DB, matches the bundled checksum). A failed
// or short copy — no space left, an interrupted write — then leaves the
// existing database untouched instead of deleting it and leaving nothing.
const replace = async (destination, copyTo, expectedMd5) => {
  const staged = `${destination}.incoming`;
  if (await exists(staged)) await unlink(staged);
  try {
    await copyTo(staged);
    const { size } = await stat(staged);
    if (!(Number(size) > 0)) throw new Error(`staged copy of ${destination} is empty`);
    if (expectedMd5) {
      const actual = await fileHash(staged, "md5");
      if (actual !== expectedMd5) {
        throw new Error(`staged copy of ${destination} failed its checksum`);
      }
    }
  } catch (err) {
    if (await exists(staged)) await unlink(staged).catch(() => {});
    throw err;
  }
  // Swap: set the current file aside, move the verified copy in, and put the
  // old one back if that move fails, so a known-good file is never lost.
  const previous = `${destination}.previous`;
  const hadCurrent = await exists(destination);
  if (hadCurrent) {
    if (await exists(previous)) await unlink(previous);
    await moveFile(destination, previous);
  }
  try {
    await moveFile(staged, destination);
  } catch (err) {
    if (hadCurrent) await moveFile(previous, destination).catch(() => {});
    throw err;
  }
  if (hadCurrent) await unlink(previous).catch(() => {});
};

const copyBundledDb = async (bundledMd5) => {
  if (Platform.OS === "android") {
    await replace(LOCAL_DB_PATH, (to) => copyFileAssets(ASSET_DB_PATH, to), bundledMd5);
    await replace(LOCAL_MD5_PATH, (to) => copyFileAssets(ASSET_MD5_PATH, to));
  } else {
    await replace(LOCAL_DB_PATH, (to) => copyFile(BUNDLED_DB_PATH, to), bundledMd5);
    await replace(LOCAL_MD5_PATH, (to) => copyFile(BUNDLED_MD5_PATH, to));
  }
  // Written only after both files are in place, so an interrupted refresh is
  // simply retried on the next launch.
  if (bundledMd5) await writeFile(BUNDLED_MARKER_PATH, bundledMd5);
};

/**
 * Ensure the DB file is present in a writable location, and is at least as new
 * as the DB bundled in this app build.
 *
 * `ensureDbExists` historically only seeded the DB on a fresh install (when no
 * local copy existed), so app upgrades never refreshed it: an updated bundled
 * DB shipped in a new release never reached devices that already had an older
 * one, leaving upgraders on stale data (e.g. empty GurmukhiUni → bani names
 * rendering as legacy-ASCII gibberish in Manage Downloads). We now also re-copy
 * the bundled DB whenever its checksum differs from the build we last seeded.
 *
 * The comparison is against BUNDLED_MARKER_PATH (the bundled DB we last copied),
 * NOT the live DB's checksum — so a user-applied remote DB update is preserved
 * within an app version and only a new app build's bundled DB triggers a refresh.
 */
const seedOrRefreshDb = async () => {
  try {
    const dbExists = await exists(LOCAL_DB_PATH);
    const bundledMd5 = await readBundledMD5Hash();

    if (!dbExists) {
      await copyBundledDb(bundledMd5);
      return;
    }

    // A DB is already on disk. Refresh it only when this build ships a bundled
    // DB different from the one we last seeded (i.e. an app upgrade with new
    // data). If we can't read the bundled checksum, leave the existing DB alone.
    const seededMd5 = await readHashFile(BUNDLED_MARKER_PATH);
    if (!bundledMd5 || bundledMd5 === seededMd5) return;

    // No marker yet: the first launch of this code on an existing install, so
    // the marker can't say what's on disk, but the saved checksum can. It is the
    // bundled checksum after a seed, and the remote one after an in-app update.
    // If it already equals this build's bundled DB, adopt it. That also covers
    // a downloaded update, because the published remote DB IS this bundled DB
    // (both be841ae9…, June 2025). Anything else predates both, e.g. the old
    // bundled DB with empty Gurmukhi names, and is exactly what this refresh is
    // for. If a newer DB is ever published remotely, bundle it in the next build
    // too, or this would replace a newer download with an older bundled copy.
    if (!seededMd5 && (await readHashFile(LOCAL_MD5_PATH)) === bundledMd5) {
      await writeFile(BUNDLED_MARKER_PATH, bundledMd5);
      return;
    }

    // A failed refresh is not fatal: the swap in `replace` puts the existing
    // database back, and it is still perfectly usable. Throwing here would fail
    // every query (initDB awaits this before opening). The marker is not
    // written, so the refresh is tried again on the next launch.
    try {
      logMessage("Bundled DB changed since last seed — refreshing on-device DB.");
      await copyBundledDb(bundledMd5);
    } catch (refreshError) {
      logError("Bundled DB refresh failed; keeping the existing database", refreshError);
    }
  } catch (err) {
    logError(`ensureDbExists error: ${err.message}`);
    throw err;
  }
};

// initDB() calls this before every query, and the first queries of a launch run
// in parallel. Each one used to start its own copy into the same staging file,
// deleting the others' work mid-write. Now concurrent callers share one run.
// After a successful run a call only re-checks that the file is still there
// (a remote DB update replaces it), reseeding if it has gone.
let ensureInFlight = null;
let ensuredOnce = false;

export const ensureDbExists = async () => {
  if (ensuredOnce && !ensureInFlight && (await exists(LOCAL_DB_PATH))) return;
  if (!ensureInFlight) {
    ensureInFlight = seedOrRefreshDb()
      .then(() => {
        ensuredOnce = true;
      })
      .finally(() => {
        ensureInFlight = null;
      });
  }
  await ensureInFlight;
};

/**
 * Get the MD5 hash of the current local DB.
 */
export const getCurrentDBMD5Hash = async () => {
  const dbExists = await exists(LOCAL_MD5_PATH);
  if (!dbExists) {
    return null;
  }
  const hash = await readFile(LOCAL_MD5_PATH);
  return hash.trim();
};

/**
 * Compare local and remote MD5 hashes to determine if an update is needed.
 */

export const fetchRemoteMD5Hash = async () => {
  try {
    const response = await fetch(REMOTE_MD5_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote MD5 hash: ${response.status} ${response.statusText}`);
    }
    const remoteHash = await response.text();
    return remoteHash.trim();
  } catch (error) {
    // A breadcrumb only: every caller catches this error and reports it (offline
    // as a breadcrumb, a real fault such as a 404/500 as an issue), so recording
    // it here as well would file each failure twice.
    logMessage(`Error fetching remote MD5 hash: ${error.message}`);
    throw error;
  }
};

export const writeRemoteMD5Hash = async () => {
  try {
    const response = await fetch(REMOTE_MD5_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote MD5 hash: ${response.statusText}`);
    }
    const remoteHash = await response.text();
    await writeFile(LOCAL_MD5_PATH, remoteHash.trim());
    return remoteHash.trim();
  } catch (error) {
    // Breadcrumb only, for the same reason: the caller reports it.
    logMessage(`Error writing remote MD5 hash: ${error.message}`);
    throw error;
  }
};

export const checkForBaniDBUpdate = async () => {
  const localHash = await getCurrentDBMD5Hash();
  const remoteHash = await fetchRemoteMD5Hash();
  return localHash !== null && localHash !== remoteHash;
};

export const revertMD5Hash = async (currentMD5Hash) => {
  await writeFile(LOCAL_MD5_PATH, currentMD5Hash);
  return currentMD5Hash.trim();
};
