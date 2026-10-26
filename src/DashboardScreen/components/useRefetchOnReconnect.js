import { useEffect, useRef } from "react";
import { useNetwork } from "@common";

// Re-runs a dashboard section's fetch when connectivity comes BACK, but only if
// what's on screen came from a bundled fallback.
//
// The dashboard content services degrade rather than fail: with no internet the
// Word of the Day and Upcoming cards fall back to their bundled lists, so the
// card is never empty. The cost is that the fallback then stays on screen for
// the rest of the session — the sections fetch on mount (and Upcoming
// deliberately only on a cold start), so nothing asks again once the network
// returns. This closes that gap.
//
// `isStale` is the caller's own verdict, from the `_source` tag the services
// attach. Data that came from the API or from the day-scoped cache is NOT stale
// and is left alone, so a reconnect costs nothing in the normal case.
//
// The offline→online EDGE is what triggers, not the online state itself:
// NetworkContext defaults to online (deliberately optimistic during the startup
// window), so firing on "is online" would refetch on every mount.
const useRefetchOnReconnect = (isStale, retry) => {
  const { isOnline } = useNetwork();
  const wasOfflineRef = useRef(false);
  // Read through a ref so the effect depends only on the connectivity edge —
  // otherwise `isStale` flipping after a refetch would re-run it immediately.
  const isStaleRef = useRef(isStale);
  isStaleRef.current = isStale;

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }
    if (!wasOfflineRef.current) return;
    wasOfflineRef.current = false;
    if (isStaleRef.current) retry();
  }, [isOnline, retry]);
};

export default useRefetchOnReconnect;
