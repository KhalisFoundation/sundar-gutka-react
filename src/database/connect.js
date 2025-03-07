import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import { constant, errorHandler } from "@common";

enablePromise(true);
let databaseInstance = null;
let initializingPromise = null;

const initDB = async () => {
  if (databaseInstance) {
    return databaseInstance;
  }

  if (initializingPromise) {
    return initializingPromise;
  }
  initializingPromise = openDatabase({
    name: constant.DB,
    createFromLocation: 1,
  })
    .then((db) => {
      databaseInstance = db;
      initializingPromise = null; // Reset the initializing promise
      return db;
    })
    .catch((error) => {
      errorHandler(error);
      initializingPromise = null; // Allow retry on next call
      throw error; // Rethrow the original error
    });

  return initializingPromise;
};

export default initDB;
