import { useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { actions, checkForBaniDBUpdate, logError } from "@common";

const useDatabaseUpdateCheck = () => {
  const dispatch = useDispatch();
  const checkForUpdates = useCallback(async () => {
    try {
      const isUpdateAvailable = await checkForBaniDBUpdate();
      dispatch(actions.toggleDatabaseUpdateAvailable(isUpdateAvailable));
    } catch (error) {
      logError("useDatabaseUpdateCheck", error);
      dispatch(actions.toggleDatabaseUpdateAvailable(false));
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, []);
};

export default useDatabaseUpdateCheck;
