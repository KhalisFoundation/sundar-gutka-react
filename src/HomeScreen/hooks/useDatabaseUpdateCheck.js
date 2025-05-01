import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { actions, checkForBaniDBUpdate } from "@common";

const useDatabaseUpdateCheck = () => {
  const dispatch = useDispatch();
  const dbCheck = async () => {
    const isUpdateAvailable = await checkForBaniDBUpdate();
    dispatch(actions.toggleDatabaseUpdateAvailable(isUpdateAvailable));
  };

  useEffect(() => {
    dbCheck();
  }, []);
};

export default useDatabaseUpdateCheck;
