import { useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { actions, checkForBaniDBUpdate, logError, useRemote } from "@common";

const useDatabaseUpdateCheck = () => {
  const dispatch = useDispatch();
  const { REMOTE_DB_URL } = useRemote();
  const checkForUpdates = useCallback(async () => {
    try {
      const isUpdateAvailable = await checkForBaniDBUpdate(REMOTE_DB_URL);
      dispatch(actions.toggleDatabaseUpdateAvailable(isUpdateAvailable));
    } catch (error) {
      logError("useDatabaseUpdateCheck", error);
      dispatch(actions.toggleDatabaseUpdateAvailable(false));
    }
  }, [REMOTE_DB_URL]);

  useEffect(() => {
    checkForUpdates();
  }, []);
};

export default useDatabaseUpdateCheck;
