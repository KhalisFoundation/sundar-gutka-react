import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import { logError, logMessage } from "@common";
import { currentAccountKey, dbNameFor, setAccountKey } from "./accountDb";
import { initSchema } from "./schema";

enablePromise(true);

const analyticsInstance = { value: null };
// Which account's file the cached handle above belongs to. Without this the
// singleton would keep serving the PREVIOUS account's database after a switch —
// the handle is cached, and nothing about it says whose data it holds.
let openedForKey = null;
let analyticsInitPromise = null;

/**
 * Point the analytics database at an account (or at the signed-out store when
 * `email` is null), closing the currently open file if it belongs to someone
 * else. The next getAnalyticsDB() opens the right one.
 *
 * Nothing is deleted. Each account's history stays on disk, so signing back in
 * finds it again — including whatever had not been pushed yet.
 */
export const useAnalyticsAccount = async (email) => {
  const changed = setAccountKey(email);
  if (!changed) return false;
  // In-flight opens belong to the OLD key; drop the promise so the next caller
  // starts a fresh open rather than awaiting the wrong file.
  analyticsInitPromise = null;
  if (analyticsInstance.value) {
    try {
      await analyticsInstance.value.close();
    } catch (err) {
      logMessage(`analytics_db_close_failed: ${err?.message || err}`);
    }
    analyticsInstance.value = null;
    openedForKey = null;
  }
  return true;
};

export const getAnalyticsDB = async () => {
  const key = currentAccountKey();
  if (analyticsInstance.value && openedForKey === key) {
    return analyticsInstance.value;
  }
  if (analyticsInitPromise && openedForKey === key) {
    return analyticsInitPromise;
  }

  openedForKey = key;
  analyticsInitPromise = openDatabase({
    name: dbNameFor(key),
    location: "Documents",
  })
    .then(async (db) => {
      await initSchema(db);
      analyticsInstance.value = db;
      analyticsInitPromise = null;
      logMessage(`Analytics DB initialized (${dbNameFor(key)})`);
      return db;
    })
    .catch((err) => {
      analyticsInitPromise = null;
      logMessage(`analytics_db_open_failed: ${err?.message || err}`);
      logError(new Error(`Analytics DB open failed: ${err?.message || err}`));
      throw err;
    });

  return analyticsInitPromise;
};

export const closeAnalyticsDB = async () => {
  if (analyticsInstance.value) {
    await analyticsInstance.value.close();
    analyticsInstance.value = null;
    openedForKey = null;
  }
};
