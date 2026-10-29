import { useEffect, useRef, useCallback, useState } from "react";
import { AppState } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { logError, logMessage, trackAudioStarted, trackAudioCompleted } from "@common";
import {
  insertAudioSession,
  upsertDailyActivity,
  enqueueAnalyticsWrite,
} from "../../database/analytics";
import { requestPush } from "../../services/dashboard/syncSignal";
import { secondsPerDay, splitSpanByLocalDay } from "../../services/streakDays";

// How often time played is written down while audio keeps going. Audio plays
// on with the phone locked, and an app killed there (swiped away, or the OS
// reclaiming it) lost every minute since the Reader was last left.
const CHECKPOINT_MS = 60 * 1000;

const useListeningSession = ({
  baniId,
  baniTitle,
  isPlaying,
  currentPlayingId,
  artistId,
  artistName,
}) => {
  const navigation = useNavigation();

  // Play time accumulated per LOCAL day, in milliseconds. Keyed by day so a
  // listen that runs past midnight is credited to both days rather than to
  // whichever one it was flushed on; milliseconds rather than seconds so
  // repeated pause/resume rounds once, at save, instead of on every segment.
  const bucketsRef = useRef({});
  const playStartRef = useRef(null);
  const hasTrackedStartRef = useRef(false);
  // The bani the session in progress belongs to, taken when it begins. The
  // Reader is REUSED across banis, and the save used to close over the props:
  // a swap filed the time under the wrong bani, and the save the old closure
  // made closed the playing segment for good — nothing reopened it, so every
  // minute after the swap went unrecorded.
  const sessionBaniRef = useRef(null);
  const takeBani = () => {
    if (!sessionBaniRef.current) sessionBaniRef.current = { baniId, baniTitle };
  };
  // A title that arrives a render after its id belongs to the same session.
  if (sessionBaniRef.current?.baniId === baniId && baniTitle) {
    sessionBaniRef.current.baniTitle = baniTitle;
  }
  // Seconds of this session already written to the day rows by a checkpoint.
  // The session's own row is written once, at the end, with the whole of it.
  const checkpointedRef = useRef(0);

  // Closes the segment currently playing and files it under the day(s) it
  // covered. Safe to call when nothing is playing.
  const closeSegment = useCallback(() => {
    if (!playStartRef.current) return;
    const spans = splitSpanByLocalDay(playStartRef.current, Date.now());
    Object.keys(spans).forEach((date) => {
      bucketsRef.current[date] = (bucketsRef.current[date] ?? 0) + spans[date];
    });
    playStartRef.current = null;
  }, []);

  // Keep mutable refs so saveSession never needs to be recreated on track switch
  const currentPlayingIdRef = useRef(currentPlayingId);
  const artistIdRef = useRef(artistId);
  const artistNameRef = useRef(artistName);
  useEffect(() => {
    currentPlayingIdRef.current = currentPlayingId;
  }, [currentPlayingId]);
  useEffect(() => {
    artistIdRef.current = artistId;
  }, [artistId]);
  useEffect(() => {
    artistNameRef.current = artistName;
  }, [artistName]);

  // The playback state is the one global player's, so a Reader left under
  // another Reader saw its audio as playing too and counted the same seconds a
  // second time. Only the Reader in front counts; a Reader pauses its own audio
  // when it loses focus, so nothing it played is missed.
  const [focused, setFocused] = useState(() => navigation.isFocused?.() ?? true);
  useEffect(() => {
    const offFocus = navigation.addListener("focus", () => setFocused(true));
    const offBlur = navigation.addListener("blur", () => setFocused(false));
    return () => {
      offFocus();
      offBlur();
    };
  }, [navigation]);
  const counting = isPlaying && focused;

  // Accumulate wall-clock time while it plays here; fire analytics on first play
  useEffect(() => {
    if (counting) {
      if (!hasTrackedStartRef.current) {
        hasTrackedStartRef.current = true;
        logMessage(
          `audio_play: id=${currentPlayingIdRef.current ?? "unknown"} artist=${
            artistIdRef.current ?? "unknown"
          }`
        );
        trackAudioStarted(
          currentPlayingIdRef.current ?? null,
          baniTitle ?? null,
          artistNameRef.current ?? null
        ).catch(() => {});
      }
      takeBani();
      playStartRef.current = Date.now();
    } else {
      closeSegment();
    }
    // `takeBani` reads the current props; the session's bani is fixed once taken.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counting, closeSegment]);

  // Writes the time played so far to the day rows. Playing on, the open
  // segment is closed here and a new one starts at once, so nothing is counted
  // twice and nothing between the two is lost.
  const checkpoint = useCallback(() => {
    const playing = !!playStartRef.current;
    closeSegment();
    if (playing) playStartRef.current = Date.now();
    const daySlices = secondsPerDay(bucketsRef.current);
    bucketsRef.current = {};
    const seconds = daySlices.reduce((sum, slice) => sum + slice.seconds, 0);
    if (seconds <= 0) return;
    checkpointedRef.current += seconds;
    enqueueAnalyticsWrite(async () => {
      try {
        await Promise.all(
          daySlices.map((slice) =>
            upsertDailyActivity({
              date: slice.date,
              reading_seconds_delta: 0,
              listening_seconds_delta: slice.seconds,
            })
          )
        );
        // Local totals just moved, so the cloud copy is stale. Fire-and-forget:
        // the sync hook debounces, so a long listening session is one push.
        requestPush("listening-session");
      } catch (err) {
        logError(new Error(`useListeningSession save failed: ${err?.message || err}`));
      }
    });
  }, [closeSegment]);

  // Synchronous — the last checkpoint, then the session's own row.
  const saveSession = useCallback(() => {
    closeSegment();
    checkpoint();
    const durationSeconds = checkpointedRef.current;
    checkpointedRef.current = 0;
    const bani = sessionBaniRef.current;
    sessionBaniRef.current = null;
    if (durationSeconds <= 0 || !bani) return;
    enqueueAnalyticsWrite(async () => {
      try {
        await insertAudioSession({
          audio_id: currentPlayingIdRef.current ?? null,
          bani_id: bani.baniId,
          bani_title: bani.baniTitle ?? null,
          artist_id: artistIdRef.current ?? null,
          artist_name: artistNameRef.current ?? null,
          duration_played: durationSeconds,
          completed: false,
        });
        trackAudioCompleted(durationSeconds, artistIdRef.current ?? null).catch(() => {});
      } catch (err) {
        logError(new Error(`useListeningSession save failed: ${err?.message || err}`));
      }
    });
  }, [closeSegment, checkpoint]);

  // While it plays, and as the app goes to the background — where audio plays
  // on and the app may never come back to save on leaving the screen.
  useEffect(() => {
    if (!counting) return undefined;
    const timer = setInterval(checkpoint, CHECKPOINT_MS);
    return () => clearInterval(timer);
  }, [counting, checkpoint]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      // `inactive` too: iOS's app switcher, from which a swipe ends the app.
      if (state === "background" || state === "inactive") checkpoint();
    });
    return () => sub.remove();
  }, [checkpoint]);

  // The bani swapped while it played: what was heard is the old bani's, and
  // the new one goes on from here.
  useEffect(() => {
    const { current } = sessionBaniRef;
    if (!current || current.baniId === baniId) return;
    const playing = !!playStartRef.current;
    saveSession();
    if (playing) {
      takeBani();
      playStartRef.current = Date.now();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baniId, saveSession]);

  // The session ends when the screen is left.
  useEffect(() => {
    const unsubBlur = navigation.addListener("blur", () => saveSession());
    return () => {
      unsubBlur();
      saveSession();
    };
  }, [navigation, saveSession]);
};

export default useListeningSession;
