// The ustaad recording is one long track per bani, so "hear this line" means seek to its
// start and stop at its end. Track player has no play-a-range, so a position poll drives
// the stop; buffering then pushes the stop later instead of truncating the line.
//
// iOS caveat carried from the design app: recording leaves the audio session in a
// play-and-record category that can route playback to the earpiece. Track player
// re-claims the playback session on reset/add, which is why listen() always resets.
import { useCallback, useEffect, useRef, useState } from "react";
import TrackPlayer from "react-native-track-player";
import { TrackPlayerSetup } from "@common/TrackPlayerUtils";

const UNAVAILABLE = "Reference audio is currently unavailable.";

// Worst-case overshoot past a line's end; lines run a few seconds, so it stays small.
const POLL_MS = 100;

// The id carries the URL, so a new bani or reciter replaces the loaded track instead of
// seeking inside the old one.
const loadTrack = async (url, id, title = "Kids Mode") => {
  await TrackPlayerSetup();
  const active = await TrackPlayer.getActiveTrack().catch(() => undefined);
  if (active?.id === id) return;
  await TrackPlayer.reset();
  await TrackPlayer.add({ id, url, title, artist: "Kids Mode" });
};

export const useReferenceAudio = (trackUrl, title) => {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const timerRef = useRef(null);
  // A tap or stop while a load is in flight makes that load a no-op when it lands.
  const loadRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    loadRef.current += 1;
    endRef.current = null;
    clearTimer();
    setPlaying(false);
    setError("");
    TrackPlayer.pause().catch(() => {});
  }, []);

  const listen = useCallback(
    (start, end, rate = 1) => {
      setError("");
      endRef.current = end;
      clearTimer();
      loadRef.current += 1;
      // No recording of this bani by any reciter, or the line has no timing in it.
      if (!trackUrl || start === undefined) {
        endRef.current = null;
        setPlaying(false);
        setError(UNAVAILABLE);
        return;
      }
      const load = loadRef.current;
      const current = () => load === loadRef.current;
      loadTrack(trackUrl, `kids-reference-${trackUrl}`, title)
        .then(() => current() && TrackPlayer.pause())
        .then(() => current() && TrackPlayer.seekTo(start))
        .then(() => current() && TrackPlayer.setRate(rate))
        .then(() => current() && TrackPlayer.play())
        .then(() => {
          if (!current()) return;
          setPlaying(true);
          timerRef.current = setInterval(async () => {
            try {
              const { position } = await TrackPlayer.getProgress();
              if (endRef.current !== null && position >= endRef.current) {
                endRef.current = null;
                clearTimer();
                setPlaying(false);
                await TrackPlayer.pause();
              }
            } catch {
              clearTimer();
            }
          }, POLL_MS);
        })
        .catch(() => {
          if (!current()) return;
          endRef.current = null;
          setPlaying(false);
          setError(UNAVAILABLE);
        });
    },
    [trackUrl, title]
  );

  // Leaving the screen should not leave the ustaad reciting.
  useEffect(
    () => () => {
      loadRef.current += 1;
      clearTimer();
      TrackPlayer.pause().catch(() => {});
    },
    []
  );

  return { playing, error, listen, stop };
};

// Word clips share the one track player with the reference, so playing a clip replaces
// the loaded reference track; the next listen() reloads it.
export const useClipPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  const play = useCallback((url) => {
    setError("");
    loadTrack(url, `kids-clip-${url}`)
      .then(() => TrackPlayer.play())
      .then(() => setPlaying(true))
      .catch(() => {
        setPlaying(false);
        setError("This word’s recording is unavailable.");
      });
  }, []);

  const stop = useCallback(() => {
    setPlaying(false);
    TrackPlayer.pause().catch(() => {});
  }, []);

  return { playing, error, play, stop };
};
