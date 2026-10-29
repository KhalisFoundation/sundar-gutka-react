import { useCallback, useEffect, useRef, useState } from "react";
import { logMessage, logNetworkError } from "@common";
import { isExpectedDataFailure } from "../../services/dashboard/dataFailures";

// Standardizes the loading/error lifecycle for a dashboard section's async
// fetch. `task` is a useCallback-memoized function that fetches data and sets
// the caller's own state (its identity should change whenever the section
// needs to refetch, e.g. on refreshKey).
//
// - `loading` is true only until the FIRST attempt (success or failure)
//   settles, so returning to the dashboard never re-shows a skeleton over
//   already-loaded content.
// - `refreshing` is true for every LATER run. Because `loading` stays false
//   once data is on screen, it is the only way a caller can tell that a
//   user-triggered refetch is in flight — which is what a refresh control
//   needs in order to show progress instead of appearing to do nothing.
// - `error` is only set when the first attempt fails with nothing to fall
//   back on — a background refetch failure after a prior success leaves the
//   last-known-good data on screen instead of blanking it out.
const useAsyncSection = (task) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const loadedOnceRef = useRef(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    if (loadedOnceRef.current) setRefreshing(true);
    task()
      .then(() => {
        if (!active) return;
        loadedOnceRef.current = true;
        setError(false);
      })
      .catch((err) => {
        if (!active) return;
        // Offline and "nothing to show" are states this hook renders, and a
        // connection failure is the phone's, not ours; only a real fault is
        // recorded as one.
        if (isExpectedDataFailure(err)) logMessage(String(err?.message || err));
        else logNetworkError(err, err);
        if (!loadedOnceRef.current) setError(true);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, nonce]);

  const retry = useCallback(() => {
    if (!loadedOnceRef.current) setLoading(true);
    setNonce((n) => n + 1);
  }, []);

  return { loading, refreshing, error, retry };
};

export default useAsyncSection;
