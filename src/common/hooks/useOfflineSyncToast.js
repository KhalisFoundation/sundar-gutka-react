import { useEffect } from "react";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STRINGS, showInfoToast, useNetwork, logError } from "@common";

const LAST_SHOWN_KEY = "@offline_sync_toast_last_shown";
const DAY_MS = 24 * 60 * 60 * 1000;

// App-wide (not screen-scoped) so it fires no matter which tab/screen is open
// when connectivity drops — lets the user know their changes aren't syncing
// while offline, throttled to once a day so it doesn't nag. Signed in, with
// changes waiting, only: otherwise there is nothing to sync, and the message
// would only puzzle.
const useOfflineSyncToast = () => {
  const { isOffline } = useNetwork();
  const signedIn = useSelector((state) => state.auth?.status === "signedIn");
  // Only when something is actually waiting: told "connect to sync" with
  // nothing to sync, the once-a-day allowance was spent before a real change
  // came along.
  const pending = useSelector((state) => Object.keys(state.syncOutbox?.ops ?? {}).length > 0);

  useEffect(() => {
    if (!signedIn || !isOffline || !pending) return undefined;
    let active = true;
    (async () => {
      try {
        const lastRaw = await AsyncStorage.getItem(LAST_SHOWN_KEY);
        if (lastRaw && Date.now() - Number(lastRaw) < DAY_MS) return;
        if (!active) return;
        showInfoToast(STRINGS.SYNC_OFFLINE_MESSAGE);
        await AsyncStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
      } catch (err) {
        logError(err);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOffline, signedIn, pending]);
};

export default useOfflineSyncToast;
