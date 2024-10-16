import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import { constant, errorHandler } from "@common";

enablePromise(true);
let database;

const initDB = async () => {
  if (database) {
    return database;
  }
  try {
    database = await openDatabase({
      name: constant.DB,
      createFromLocation: 1,
    });
    return database;
  } catch (error) {
    errorHandler(error);
    throw new Error(error);
  }
};

export default initDB;
