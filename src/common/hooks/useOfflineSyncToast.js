import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STRINGS, showInfoToast, useNetwork, logError } from "@common";

const LAST_SHOWN_KEY = "@offline_sync_toast_last_shown";
const DAY_MS = 24 * 60 * 60 * 1000;

// App-wide (not screen-scoped) so it fires no matter which tab/screen is open
// when connectivity drops — lets the user know their streak/progress isn't
// syncing while offline, throttled to once a day so it doesn't nag.
const useOfflineSyncToast = () => {
  const { isOffline } = useNetwork();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!isOffline || shownRef.current) return undefined;
    let active = true;
    (async () => {
      try {
        const lastRaw = await AsyncStorage.getItem(LAST_SHOWN_KEY);
        if (lastRaw && Date.now() - Number(lastRaw) < DAY_MS) return;
        if (!active) return;
        shownRef.current = true;
        showInfoToast(STRINGS.SYNC_OFFLINE_MESSAGE);
        await AsyncStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
      } catch (err) {
        logError(err);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOffline]);
};

export default useOfflineSyncToast;
