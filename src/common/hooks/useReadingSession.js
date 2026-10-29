import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { logError, trackBaniCompleted } from "@common";
import {
  insertReadSession,
  upsertDailyActivity,
  incrementBaniReadCount,
  enqueueAnalyticsWrite,
} from "../../database/analytics";
import { requestPush } from "../../services/dashboard/syncSignal";
import { secondsPerDay, splitSpanByLocalDay } from "../../services/streakDays";

// Completion is based on how far the user scrolled through the bani, not time
// spent — a bani is "read" once the scroll bar crosses this percentage.
const COMPLETION_SCROLL_PERCENT = 95;

const useReadingSession = ({ baniId, baniTitle, navigation, scrollPercentRef }) => {
  const startTimeRef = useRef(null);

  // Synchronous — captures timestamps and queues DB work; returns instantly.
  const saveSession = useCallback(() => {
    if (!startTimeRef.current) return;
    const start = startTimeRef.current;
    startTimeRef.current = null;

    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - start) / 1000);
    if (durationSeconds <= 0) return;

    // Read at call time (not captured at hook-init), so it reflects wherever
    // the user actually scrolled to during this specific session.
    const completed = (scrollPercentRef?.current ?? 0) >= COMPLETION_SCROLL_PERCENT;

    // Credited to the local day(s) the reading actually happened on, not the
    // one it was flushed on: a sitting that runs past midnight is split at the
    // boundary. Local rather than UTC so the day — and the year boundary the
    // "In Nitnem this year" total resets on — is the user's own, matching how
    // the dashboard reads dates back.
    const daySlices = secondsPerDay(splitSpanByLocalDay(start, endTime));
    enqueueAnalyticsWrite(async () => {
      try {
        await Promise.all([
          insertReadSession({
            bani_id: baniId,
            bani_title: baniTitle ?? null,
            start_time: start,
            end_time: endTime,
            duration_seconds: durationSeconds,
            completed,
          }),
          ...daySlices.map((slice) =>
            upsertDailyActivity({
              date: slice.date,
              reading_seconds_delta: slice.seconds,
              listening_seconds_delta: 0,
            })
          ),
          incrementBaniReadCount(baniId, baniTitle ?? null),
        ]);
        trackBaniCompleted(baniId, baniTitle, durationSeconds).catch(() => {});
        // Local totals just moved, so the cloud copy is stale. Fire-and-forget:
        // the sync hook debounces, so a sitting of several banis is one push.
        requestPush("reading-session");
      } catch (err) {
        logError(new Error(`useReadingSession save failed: ${err?.message || err}`));
      }
    });
  }, [baniId, baniTitle]);

  const startSession = useCallback(() => {
    if (startTimeRef.current) return;
    startTimeRef.current = Date.now();
  }, []);

  // A session is flushed on FOUR distinct signals because no single one fires
  // reliably across every way the user can leave the Reader. saveSession is
  // idempotent (it nulls startTimeRef on the first call), so overlapping
  // triggers still record at most one session — never a double count.
  //
  //  • focus         → start the timer when the screen becomes active.
  //  • beforeRemove  → the canonical "this screen is being popped off the
  //                    stack" event, dispatched synchronously by the navigation
  //                    action itself BEFORE the native screen is frozen/detached.
  //                    This is what fixes the footer "All Banis" button: it
  //                    leaves via navigation.popToTop(), and with the native
  //                    stack + react-native-screens that can detach the outgoing
  //                    Reader abruptly, so the plain "blur"/unmount saves below
  //                    were racing the teardown and getting dropped intermittently
  //                    (— the read "sometimes" didn't count). beforeRemove fires
  //                    reliably for back button, back arrow, swipe-back AND
  //                    popToTop, so every exit path now flushes.
  //  • blur          → still needed for the push-ON-TOP case (Reader → Settings/
  //                    Bookmarks), where the Reader is NOT removed from the stack
  //                    so beforeRemove does not fire, but reading has paused.
  //  • unmount       → final belt-and-suspenders fallback.
  useEffect(() => {
    const unsubFocus = navigation.addListener("focus", startSession);
    const unsubBeforeRemove = navigation.addListener("beforeRemove", saveSession);
    const unsubBlur = navigation.addListener("blur", saveSession);
    return () => {
      unsubFocus();
      unsubBeforeRemove();
      unsubBlur();
    };
  }, [navigation, startSession, saveSession]);

  // App background → save, foreground → restart
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        saveSession();
      } else if (state === "active") {
        startSession();
      }
    });
    return () => subscription.remove();
  }, [saveSession, startSession]);

  // Unmount cleanup (e.g. hardware back)
  useEffect(() => {
    return () => {
      saveSession();
    };
  }, [saveSession]);
};

export default useReadingSession;
