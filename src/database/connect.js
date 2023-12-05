import { openDatabase, enablePromise } from "react-native-sqlite-storage";
import FallBack from "../common/components/FallbackComponent";
import CONSTANT from "../common/constant";
import errorHandler from "../common/errHandler";

enablePromise(true);
let database;

const initDB = async () => {
  if (database) {
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
    errorHandler(error);
    FallBack();
  }
};

export default initDB;
