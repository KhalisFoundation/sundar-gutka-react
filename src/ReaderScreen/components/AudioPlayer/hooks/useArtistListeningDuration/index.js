import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { trackArtistListeningDuration } from "@common";

/**
 * Custom hook to track artist listening duration
 * Tracks actual listening time using timestamps, independent of seeking behavior
 *
 * @param {boolean} isPlaying - Whether audio is currently playing
 * @param {Object} currentPlaying - Current track object with displayName (artist name) and id
 */
const useArtistListeningDuration = (baniID, isPlaying, currentPlaying) => {
  const navigation = useNavigation();
  const trackedArtistRef = useRef(null);
  const trackedTrackIdRef = useRef(null);
  const playStartTimeRef = useRef(null);

  // Extract primitive values to avoid unnecessary effect runs from object reference changes
  // React compares these primitive values by value, not by reference
  const currentArtist = currentPlaying?.displayName;
  const currentTrackId = currentPlaying?.id;

  // Helper function to calculate and track duration
  const trackDuration = async () => {
    if (trackedArtistRef.current && playStartTimeRef.current) {
      const finalDuration = Math.floor((Date.now() - playStartTimeRef.current) / 1000);
      if (finalDuration > 0) {
        try {
          await trackArtistListeningDuration(baniID, trackedArtistRef.current, finalDuration);
        } catch (error) {
          // Silently fail - analytics should never crash the app
          // Event is still queued by Firebase even if await fails
        }
      }
      playStartTimeRef.current = null;
      trackedArtistRef.current = null;
      trackedTrackIdRef.current = null;
    }
  };

  // Track artist listening duration
  useEffect(() => {
    // If artist or track changed, track the previous artist's duration
    if (
      trackedArtistRef.current &&
      playStartTimeRef.current &&
      (trackedArtistRef.current !== currentArtist || trackedTrackIdRef.current !== currentTrackId)
    ) {
      (async () => {
        await trackDuration();
      })();
    }

    // Start tracking new artist when playback starts
    if (currentArtist && currentTrackId && isPlaying) {
      // If this is a new artist or track, initialize tracking
      if (
        trackedArtistRef.current !== currentArtist ||
        trackedTrackIdRef.current !== currentTrackId
      ) {
        trackedArtistRef.current = currentArtist;
        trackedTrackIdRef.current = currentTrackId;
        playStartTimeRef.current = Date.now();
      }
    }

    // Track duration when playback stops
    if (!isPlaying && trackedArtistRef.current && playStartTimeRef.current) {
      (async () => {
        await trackDuration();
      })();
    }
  }, [isPlaying, currentArtist, currentTrackId, baniID]);

  // Track when user navigates away from screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      // Track artist listening duration when leaving screen
      if (trackedArtistRef.current && playStartTimeRef.current) {
        // Use IIFE to handle async in event listener
        (async () => {
          await trackDuration();
        })();
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Track on component unmount
  useEffect(() => {
    return () => {
      // Track artist listening duration before unmounting
      if (trackedArtistRef.current && playStartTimeRef.current) {
        (async () => {
          await trackDuration();
        })();
      }
    };
  }, []);
};

export default useArtistListeningDuration;
