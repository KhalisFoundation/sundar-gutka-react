import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import actions from "@common/actions";

const checkIfUpdateAvalaible = async (MD5Hash) => {
  // Fetch MD5 hash from the server for latest database
  const newMD5Hash = await fetch("https://yourapi.com/db/version");
  if (newMD5Hash !== MD5Hash) {
    return true;
  }
  return false;
};

const useDatbaseUpdateCheck = () => {
  const dispatch = useDispatch();
  const databaseMD5Hash = useSelector((state) => state.databaseMD5Hash);

  useEffect(() => {
    const isUpdateAvailable = checkIfUpdateAvalaible(databaseMD5Hash);
    if (isUpdateAvailable) {
      dispatch(actions.toggleDatabaseUpdateAvailable(true));
    }
  }, []);
};

export default useDatbaseUpdateCheck;
