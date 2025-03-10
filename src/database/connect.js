import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import { FallBack, constant, errorHandler } from "@common";

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
    errorHandler(error, {
      context: "Opening database error",
      name: constant.DB,
      functionName: "initDB",
      location: "src/database/connect.js",
    });
    FallBack();
    return null;
  }
};

export default initDB;
