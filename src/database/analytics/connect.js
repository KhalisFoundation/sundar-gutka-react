import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import { logError, logMessage } from "@common";
import { currentAccountKey, dbNameFor, setAccountKey } from "./accountDb";
import { runSerialized } from "./queue";
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
const switchAccountNow = async (email) => {
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

// Through the query queue, like every read and write. A pull queues hundreds
// of writes for the account it began for; switching the file underneath them
// sent the rest into the next store — the signed-out one, which the next
// sign-in then claims as its own activity. Queued, they finish on the file
// they were meant for, and only then does the handle move.
export const useAnalyticsAccount = (email) => runSerialized(() => switchAccountNow(email));

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
      // Opened for a key that is no longer current: handing it back would put
      // this caller's writes in another account's file.
      if (currentAccountKey() !== key) {
        await db.close().catch(() => {});
        throw new Error(`Analytics DB opened for ${key} after a switch`);
      }
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
