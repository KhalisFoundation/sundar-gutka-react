import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import RNFS from "react-native-fs";
import { FallBack, constant, logError, logMessage } from "@common";

// Enable promise-based APIs
enablePromise(true);

// Paths and URLs
const BUNDLED_DB_PATH = `${RNFS.MainBundlePath}/www/${constant.DB}`;
const LOCAL_DB_PATH = `${RNFS.DocumentDirectoryPath}/${constant.DB}`;
const REMOTE_BASE_URL = "https://banidb.blob.core.windows.net/database";
const REMOTE_MD5_URL = `${REMOTE_BASE_URL}/${constant.DB}.md5`;
const REMOTE_DB_URL = `${REMOTE_BASE_URL}/${constant.DB}`;

// Singletons
let databaseInstance = null;
let initializingPromise = null;

/**
 * Ensure the DB file is present in a writable location.
 */
const ensureDbExists = async () => {
  try {
    const exists = await RNFS.exists(LOCAL_DB_PATH);
    if (!exists) {
      logMessage(`Copying bundled DB to Documents: ${LOCAL_DB_PATH}`);
      await RNFS.copyFile(BUNDLED_DB_PATH, LOCAL_DB_PATH);
    }
  } catch (err) {
    logError(`ensureDbExists error: ${err.message}`);
    throw err;
  }
};

/**
 * Get the MD5 hash of the current local DB.
 */
const getCurrentDBMD5Hash = async () => {
  const exists = await RNFS.exists(LOCAL_DB_PATH);
  if (!exists) {
    return null;
  }
  return RNFS.hash(LOCAL_DB_PATH, "md5");
};

/**
 * Compare local and remote MD5 hashes to determine if an update is needed.
 */
const checkForBaniDBUpdate = async () => {
  const localHash = await getCurrentDBMD5Hash();
  const remoteHash = (await fetch(REMOTE_MD5_URL).then((r) => r.text())).trim();
  return localHash !== null && localHash !== remoteHash;
};

const initDB = async () => {
  await ensureDbExists();
  // await updateDatabaseIfNeeded();

  if (databaseInstance) {
    return databaseInstance;
  }
  if (initializingPromise) {
    return initializingPromise;
  }

  initializingPromise = openDatabase({
    name: constant.DB,
    location: "default",
    createFromLocation: `~www/${constant.DB}`,
  })
    .then((db) => {
      databaseInstance = db;
      initializingPromise = null;
      return db;
    })
    .catch((err) => {
      logMessage("Opening database error");
      logError(err);
      FallBack();
      initializingPromise = null;
      throw err;
    });

  return initializingPromise;
};

/**
 * Download and replace the local DB if the remote version differs.
 */
const updateDatabaseIfNeeded = async () => {
  try {
    const needsUpdate = await checkForBaniDBUpdate();
    if (!needsUpdate) {
      return false;
    }

    const tmpPath = `${LOCAL_DB_PATH}.download`;
    logMessage("Downloading new DB...");
    await RNFS.downloadFile({ fromUrl: REMOTE_DB_URL, toFile: tmpPath }).promise;

    // Close any open DB
    if (databaseInstance) {
      await databaseInstance.close();
      databaseInstance = null;
    }

    // Replace files
    if (await RNFS.exists(LOCAL_DB_PATH)) {
      await RNFS.unlink(LOCAL_DB_PATH);
    }
    await RNFS.moveFile(tmpPath, LOCAL_DB_PATH);

    logMessage("Database updated successfully.");
    await initDB();
    return true;
  } catch (err) {
    logError(`updateDatabaseIfNeeded error: ${err.message}`);
    throw err;
  }
};

/**
 * Initialize and open the SQLite database, performing copy & update checks first.
 */

export default initDB;
export { ensureDbExists, getCurrentDBMD5Hash, checkForBaniDBUpdate, updateDatabaseIfNeeded };
