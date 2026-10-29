import { useEffect, useRef, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { logError, logMessage, trackAudioStarted, trackAudioCompleted } from "@common";
import {
  insertAudioSession,
  upsertDailyActivity,
  enqueueAnalyticsWrite,
} from "../../database/analytics";
import { requestPush } from "../../services/dashboard/syncSignal";
import { secondsPerDay, splitSpanByLocalDay } from "../../services/streakDays";

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

  // Accumulate wall-clock time while isPlaying = true; fire analytics on first play
  useEffect(() => {
    if (isPlaying) {
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
      playStartRef.current = Date.now();
    } else {
      closeSegment();
    }
  }, [isPlaying, closeSegment]);

  // Synchronous — flushes accumulated time and queues DB work; returns instantly.
  const saveSession = useCallback(() => {
    closeSegment();
    const daySlices = secondsPerDay(bucketsRef.current);
    bucketsRef.current = {};

    const durationSeconds = daySlices.reduce((sum, slice) => sum + slice.seconds, 0);
    if (durationSeconds <= 0) return;
    enqueueAnalyticsWrite(async () => {
      try {
        await Promise.all([
          insertAudioSession({
            audio_id: currentPlayingIdRef.current ?? null,
            bani_id: baniId,
            bani_title: baniTitle ?? null,
            artist_id: artistIdRef.current ?? null,
            artist_name: artistNameRef.current ?? null,
            duration_played: durationSeconds,
            completed: false,
          }),
          ...daySlices.map((slice) =>
            upsertDailyActivity({
              date: slice.date,
              reading_seconds_delta: 0,
              listening_seconds_delta: slice.seconds,
            })
          ),
        ]);
        trackAudioCompleted(durationSeconds, artistIdRef.current ?? null).catch(() => {});
        // Local totals just moved, so the cloud copy is stale. Fire-and-forget:
        // the sync hook debounces, so a long listening session that ends in
        // several saves still results in one push.
        requestPush("listening-session");
      } catch (err) {
        logError(new Error(`useListeningSession save failed: ${err?.message || err}`));
      }
    });
  }, [baniId, baniTitle, closeSegment]);

  // Audio plays through app background — only save when leaving the screen
  useEffect(() => {
    const unsubBlur = navigation.addListener("blur", saveSession);
    return () => {
      unsubBlur();
      saveSession();
    };
  }, [navigation, saveSession]);
};

export default useListeningSession;
