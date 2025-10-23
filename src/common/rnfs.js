import { Platform } from "react-native";
import {
  readDir,
  DocumentDirectoryPath,
  MainBundlePath,
  readFile,
  writeFile,
  exists,
  copyFile,
  copyFileAssets,
} from "react-native-fs";
import { constant, logError } from "@common";

// Paths and URLs
const BUNDLED_DB_PATH = `${MainBundlePath}/www/${constant.DB}.db`;
const BUNDLED_MD5_PATH = `${MainBundlePath}/www/${constant.DB}.md5`;
export const LOCAL_DB_PATH = `${DocumentDirectoryPath}/${constant.DB}.db`;
const LOCAL_MD5_PATH = `${DocumentDirectoryPath}/${constant.DB}.md5`;
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

/**
 * Ensure the DB file is present in a writable location.
 */
export const ensureDbExists = async () => {
  try {
    const dbExists = await exists(LOCAL_DB_PATH);
    if (!dbExists) {
      if (Platform.OS === "android") {
        await copyFileAssets(`www/${constant.DB}.db`, LOCAL_DB_PATH);
        await copyFileAssets(`www/${constant.DB}.md5`, LOCAL_MD5_PATH);
      } else {
        await copyFile(BUNDLED_DB_PATH, LOCAL_DB_PATH);
        await copyFile(BUNDLED_MD5_PATH, LOCAL_MD5_PATH);
      }
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
    logError(`Error fetching remote MD5 hash: ${error.message}`);
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
    logError(`Error writing remote MD5 hash: ${error.message}`);
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
