// The ustaad recording is one long track per bani, so "hear this line" means seek to its
// start and stop at its end. Track player has no play-a-range, so a position poll drives
// the stop; buffering then pushes the stop later instead of truncating the line.
//
// iOS caveat carried from the design app: recording leaves the audio session in a
// play-and-record category that can route playback to the earpiece. Track player
// re-claims the playback session on reset/add, which is why listen() always resets.
import { useCallback, useEffect, useRef, useState } from "react";
import TrackPlayer from "react-native-track-player";
import constant from "@common/constant";
import { TrackPlayerSetup } from "@common/TrackPlayerUtils";

// Only Bhai Jarnail Singh's Japji path is confirmed on the CDN; other reciters fall back to it.
const RECITER_TRACKS = { bjs: "BhaiJarnailSingh/JapjiSahib.m4a" };

export const referenceTrackUrl = (reciter = "bjs") =>
  `${constant.AUDIO_BASE_URL}/${RECITER_TRACKS[reciter] || RECITER_TRACKS.bjs}`;

export const REFERENCE_AUDIO = referenceTrackUrl("bjs");

// Worst-case overshoot past a line's end; lines run a few seconds, so it stays small.
const POLL_MS = 100;

const loadTrack = async (url, id) => {
  await TrackPlayerSetup();
  await TrackPlayer.reset();
  await TrackPlayer.add({ id, url, title: "Japji Sahib", artist: "Kids Mode" });
};

export const useReferenceAudio = (trackUrl = REFERENCE_AUDIO) => {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stop = useCallback(() => {
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
      loadTrack(trackUrl, "kids-reference")
        .then(() => TrackPlayer.seekTo(start))
        .then(() => TrackPlayer.setRate(rate))
        .then(() => TrackPlayer.play())
        .then(() => {
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
          endRef.current = null;
          setPlaying(false);
          setError("Reference audio is currently unavailable.");
        });
    },
    [trackUrl]
  );

  // Leaving the screen should not leave the ustaad reciting.
  useEffect(
    () => () => {
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
