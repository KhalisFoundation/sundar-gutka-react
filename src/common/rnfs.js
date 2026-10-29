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
} from "react-native-fs";
import { constant, logError, logMessage, logNetworkError } from "@common";

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
const replace = async (destination, copy) => {
  if (await exists(destination)) await unlink(destination);
  await copy();
};

const copyBundledDb = async (bundledMd5) => {
  if (Platform.OS === "android") {
    await replace(LOCAL_DB_PATH, () => copyFileAssets(ASSET_DB_PATH, LOCAL_DB_PATH));
    await replace(LOCAL_MD5_PATH, () => copyFileAssets(ASSET_MD5_PATH, LOCAL_MD5_PATH));
  } else {
    await replace(LOCAL_DB_PATH, () => copyFile(BUNDLED_DB_PATH, LOCAL_DB_PATH));
    await replace(LOCAL_MD5_PATH, () => copyFile(BUNDLED_MD5_PATH, LOCAL_MD5_PATH));
  }
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
export const ensureDbExists = async () => {
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
    if (bundledMd5 && bundledMd5 !== seededMd5) {
      logMessage("Bundled DB changed since last seed — refreshing on-device DB.");
      await copyBundledDb(bundledMd5);
    }
  } catch (err) {
    logError(`ensureDbExists error: ${err.message}`);
    throw err;
  }
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
    // A phone without a connection is the usual reason to land here; the
    // caller decides what to show. Not a Crashlytics error.
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
    logNetworkError(`Error writing remote MD5 hash: ${error.message}`, error);
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
