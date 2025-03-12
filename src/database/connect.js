import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import { FallBack, constant, logError, logMessage } from "@common";

enablePromise(true);
let database;

const initDB = async () => {
  try {
    if (database) {
      return database;
    }
    database = await openDatabase({
      name: constant.DB,
      createFromLocation: 1,
    });
    return database;
  } catch (error) {
    logMessage("Opening database error");
    logError(error);
    FallBack();
    return null;
  }
};

export default initDB;
