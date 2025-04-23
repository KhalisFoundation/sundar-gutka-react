import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { actions, checkForBaniDBUpdate } from "@common";

const useDatbaseUpdateCheck = () => {
  const dispatch = useDispatch();
  const dbCheck = async () => {
    const isUpdateAvailable = await checkForBaniDBUpdate();
    dispatch(actions.toggleDatabaseUpdateAvailable(isUpdateAvailable));
  };

  useEffect(() => {
    dbCheck();
  }, []);
};

export default useDatbaseUpdateCheck;
