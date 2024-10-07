import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import { FallBack, constant, errorHandler } from "@common";

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
    FallBack();
    return null;
  }
};

export default initDB;
