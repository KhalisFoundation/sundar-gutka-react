import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import CONSTANT from "../common/constant";

enablePromise(true);
let database;

const initDB = async () => {
  if (database) {
    console.log("Database is already initialised: returning database instance");
    return database;
  }
  try {
    database = await openDatabase({
      name: CONSTANT.DB,
      createFromLocation: 1,
    });
    console.log("Database open Successfully");
    return database;
  } catch (error) {
    console.error("Error in opening database", error);
    throw error; // This will propagate error to the caller if needed
  }
};

export default initDB;
