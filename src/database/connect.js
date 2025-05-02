import { Platform } from "react-native";
import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import { FallBack, constant, logError, logMessage, ensureDbExists, LOCAL_DB_PATH } from "@common";

// Enable promise-based APIs
enablePromise(true);

// Singletons
const databaseInstance = { value: null };
let initializingPromise = null;

const initDB = async () => {
  await ensureDbExists();

  if (databaseInstance.value) {
    return databaseInstance.value;
  }
  if (initializingPromise) {
    return initializingPromise;
  }

  initializingPromise = openDatabase({
    name: Platform.OS === "android" ? LOCAL_DB_PATH : `${constant.DB}.db`,
    location: "Documents",
    createFromLocation: 1,
  })
    .then((db) => {
      databaseInstance.value = db;
      initializingPromise = null;
      return db;
    })
    .catch((err) => {
      logMessage("Opening database error");
      logError(err);
      openDatabase({ name: constant.DB, createFromLocation: 1 })
        .then((db) => {
          databaseInstance.value = db;
        })
        .catch((error) => {
          logError("Error opening fallback database", error);
          logError(error);
          FallBack();
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
