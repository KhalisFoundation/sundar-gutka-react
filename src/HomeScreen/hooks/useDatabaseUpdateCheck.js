import { useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetwork } from "@common/context";
import { actions, logError } from "@common";
import { resolveUpdateCheck, UPDATE_CHECK } from "../../DatabaseUpdate/updateCheck";

const DB_UPDATE_CHECK_KEY = "lastDbUpdateCheck";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// The BACKGROUND half of the database update check — it runs itself once a day
// on the home screen and only sets the badge. The Database Update screen is the
// foreground half, and both now decide through `resolveUpdateCheck` so there is
// one rule for what counts as an update, an offline phone, or a real fault.
//
// They did not always share it. This hook called `checkForBaniDBUpdate()`
// directly and reported anything it threw with `logError`, so every launch
// without a connection filed a Crashlytics non-fatal reading
// "useDatabaseUpdateCheck Network request failed" — for a check whose whole
// answer offline is "ask again tomorrow". The screen had been taught to treat
// that as a state rather than an error; this had not.
const useDatabaseUpdateCheck = () => {
  const dispatch = useDispatch();
  const { isOffline } = useNetwork();

  const checkForUpdates = useCallback(async () => {
    try {
      // NET-02: Skip the network call if we checked within the last 24 hours
      const lastChecked = await AsyncStorage.getItem(DB_UPDATE_CHECK_KEY);
      if (lastChecked && Date.now() - Number(lastChecked) < COOLDOWN_MS) {
        return; // Within cooldown — no network request needed
      }

      const result = await resolveUpdateCheck({ isOnline: !isOffline });
      dispatch(actions.toggleDatabaseUpdateAvailable(result === UPDATE_CHECK.AVAILABLE));

      // Only a real answer starts the 24-hour clock. Stamping it after an
      // offline attempt would hide the check for a day over a moment with no
      // signal, and the badge would stay wrong until the day was up.
      if (result === UPDATE_CHECK.OFFLINE) return;
      await AsyncStorage.setItem(DB_UPDATE_CHECK_KEY, String(Date.now()));
    } catch (error) {
      // `resolveUpdateCheck` swallows the network cases itself, so anything
      // reaching here is AsyncStorage or the dispatch — a genuine fault.
      logError("useDatabaseUpdateCheck", error);
      dispatch(actions.toggleDatabaseUpdateAvailable(false));
    }
  }, [dispatch, isOffline]);

  useEffect(() => {
    checkForUpdates();
    // Deliberately once per mount, not on every connectivity flip: this is the
    // background check, and the Database Update screen is what re-checks the
    // moment a connection returns.
  }, []);
};

export default useDatabaseUpdateCheck;
