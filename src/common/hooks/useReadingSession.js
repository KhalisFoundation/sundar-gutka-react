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

// A Reader left open is not a Reader being read. With the screen kept awake
// (the default) a bani left on a stand counted every hour until the app was
// closed, and the streak, the totals and the week chart all believed it. A
// sitting with no scroll for this long ends where the reading stopped, plus a
// screenful's grace; the next scroll starts a new one. Auto-scroll and synced
// audio move the page, so they count as reading.
const IDLE_MS = 10 * 60 * 1000;
const IDLE_CREDIT_MS = 2 * 60 * 1000;
const IDLE_POLL_MS = 15 * 1000;
// Back near the top after a completion: reading the bani again, a new open.
const REREAD_SCROLL_PERCENT = 5;

const localDay = () => new Date().toDateString();

const useReadingSession = ({ baniId, baniTitle, navigation, scrollPercentRef }) => {
  // The props as they are now. A session takes the bani it belongs to when it
  // starts: the Reader is REUSED across banis (a notification tapped while
  // reading swaps the bani in place), and a save made from the old closure
  // credited the old bani again and the new one never.
  const baniRef = useRef({ baniId, baniTitle });
  baniRef.current = { baniId, baniTitle };
  // What this open of the bani has already counted. A sitting is flushed on
  // every background and every push-on-top, and each flush used to add a read
  // and — with the scroll still at the end — a completion, so locking the
  // phone three times beside a finished Japji made four. The all-time totals
  // keep the larger figure, so the inflation was permanent. Once per open now.
  //
  // An open ends with the day, and when a finished bani is read again from the
  // top: the Reader stays mounted overnight, and the same bani read the next
  // morning was never counted or ticked.
  const openRef = useRef({ baniId, day: localDay(), read: false, completed: false });
  // { start, open, baniTitle, peak } while a sitting is being timed. `peak` is
  // the furthest it got: the Reader zeroes its scroll on a bani swap before
  // this saves, and a reader who finished and scrolled back up had finished.
  const sessionRef = useRef(null);
  // The last scroll position seen, and when it changed — see IDLE_MS.
  const lastScrollRef = useRef({ value: null, at: 0 });
  // Whether the Reader is the screen in front. The app coming back to the
  // foreground restarted the timer even with Settings or Bookmarks on top,
  // and that time was credited as reading.
  const focusedRef = useRef(false);

  // Synchronous — captures timestamps and queues DB work; returns instantly.
  // `endAt` ends the sitting earlier than now (an idle one).
  const saveSession = useCallback(
    (endAt = Date.now()) => {
      const session = sessionRef.current;
      if (!session) return;
      sessionRef.current = null;

      const { start, open } = session;
      const id = open.baniId;
      const title = session.baniTitle;
      const endTime = Math.max(start, Math.min(endAt, Date.now()));
      const durationSeconds = Math.round((endTime - start) / 1000);
      if (durationSeconds <= 0) return;

      // Read at call time (not captured at hook-init), so it reflects wherever
      // the user actually scrolled to during this specific session.
      const furthest = Math.max(session.peak ?? 0, scrollPercentRef?.current ?? 0);
      const reachedEnd = furthest >= COMPLETION_SCROLL_PERCENT;
      const completed = reachedEnd && !open.completed;
      const countRead = !open.read;
      // eslint-disable-next-line no-param-reassign -- the open's own record
      open.read = true;
      // eslint-disable-next-line no-param-reassign
      if (completed) open.completed = true;

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
              bani_id: id,
              bani_title: title ?? null,
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
            ...(countRead ? [incrementBaniReadCount(id, title ?? null)] : []),
          ]);
          // Once per open, like the read count — not once per flush.
          if (countRead) trackBaniCompleted(id, title, durationSeconds).catch(() => {});
          // Local totals just moved, so the cloud copy is stale. Fire-and-forget:
          // the sync hook debounces, so a sitting of several banis is one push.
          requestPush("reading-session");
        } catch (err) {
          logError(new Error(`useReadingSession save failed: ${err?.message || err}`));
        }
      });
    },
    [scrollPercentRef]
  );

  const startSession = useCallback(() => {
    if (sessionRef.current) return;
    const { baniId: id, baniTitle: title } = baniRef.current;
    const day = localDay();
    if (openRef.current.baniId !== id || openRef.current.day !== day) {
      openRef.current = { baniId: id, day, read: false, completed: false };
    }
    const now = Date.now();
    const position = scrollPercentRef?.current ?? 0;
    sessionRef.current = { start: now, open: openRef.current, baniTitle: title, peak: position };
    lastScrollRef.current = { value: scrollPercentRef?.current ?? 0, at: now };
  }, [scrollPercentRef]);

  // The bani swapped under a sitting: the old one is saved as the old bani's,
  // and the new one starts its own count.
  useEffect(() => {
    const session = sessionRef.current;
    if (!session || session.open.baniId === baniId) return;
    saveSession();
    startSession();
  }, [baniId, saveSession, startSession]);

  // Idle: see IDLE_MS.
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const position = scrollPercentRef?.current ?? 0;
      const last = lastScrollRef.current;
      const session = sessionRef.current;
      if (session) session.peak = Math.max(session.peak ?? 0, position);
      // Finished, and back at the top: this is the bani being read again.
      const finished =
        session && (session.open.completed || session.peak >= COMPLETION_SCROLL_PERCENT);
      if (finished && position < REREAD_SCROLL_PERCENT) {
        saveSession();
        openRef.current = { ...openRef.current, read: false, completed: false };
        startSession();
      }
      if (position !== last.value) {
        lastScrollRef.current = { value: position, at: now };
        if (!sessionRef.current && focusedRef.current && AppState.currentState === "active") {
          startSession();
        }
        return;
      }
      if (sessionRef.current && now - last.at > IDLE_MS) saveSession(last.at + IDLE_CREDIT_MS);
    }, IDLE_POLL_MS);
    return () => clearInterval(timer);
  }, [scrollPercentRef, saveSession, startSession]);

  // A session is flushed on FOUR distinct signals because no single one fires
  // reliably across every way the user can leave the Reader. saveSession is
  // idempotent (it nulls sessionRef on the first call), so overlapping
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
    const unsubFocus = navigation.addListener("focus", () => {
      focusedRef.current = true;
      startSession();
    });
    // Wrapped: a listener is handed its event, which saveSession would take as
    // the time to end at.
    const unsubBeforeRemove = navigation.addListener("beforeRemove", () => saveSession());
    const unsubBlur = navigation.addListener("blur", () => {
      focusedRef.current = false;
      saveSession();
    });
    return () => {
      unsubFocus();
      unsubBeforeRemove();
      unsubBlur();
    };
  }, [navigation, startSession, saveSession]);

  // App background → save, foreground → restart
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      // `inactive` too: on iOS the app switcher only makes the app inactive,
      // and swiping it away from there ends the process with no background
      // event — the whole sitting was lost. Saving early costs nothing: the
      // timer restarts on return, and a read is counted once per open.
      if (state === "background" || state === "inactive") {
        saveSession();
      } else if (state === "active" && focusedRef.current) {
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
