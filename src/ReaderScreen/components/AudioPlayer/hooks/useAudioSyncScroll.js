import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import baniTimestamps from "@service/bani_timestamps";

const useAudioSyncScroll = (progress, isPlaying, webViewRef, baniID, artistID) => {
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const lastSequenceRef = useRef(null);
  const isScrollingRef = useRef(false);

  // Find current sequence based on audio progress
  const findCurrentSequence = (currentTime) => {
    if (!currentTime || currentTime === 0) return null;

    // Find the timestamp entry that contains the current time
    const currentTimestamp = baniTimestamps.find(
      (timestamp) => currentTime >= timestamp.start && currentTime <= timestamp.end
    );

    return currentTimestamp ? currentTimestamp.sequence : null;
  };

  // Scroll to specific sequence in WebView
  const scrollToSequence = (sequence) => {
    if (!webViewRef?.current?.postMessage || !sequence) {
      return;
    }

    try {
      // Prevent multiple rapid scroll calls
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;

      const scrollMessage = {
        action: "scrollToSequence",
        sequence,
        behavior: "smooth", // smooth scrolling
      };

      webViewRef.current.postMessage(JSON.stringify(scrollMessage));

      // Reset scrolling flag after a short delay
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    } catch (error) {
      console.error("Error sending scroll message to WebView:", error);
      isScrollingRef.current = false;
    }
  };

  // Main effect to handle sync scrolling
  useEffect(() => {
    // Only proceed if sync scroll is enabled and audio is playing
    if (!isAudioSyncScroll || !isPlaying || !progress?.position || baniID !== 2 || artistID !== 4) {
      return;
    }

    const currentSequence = findCurrentSequence(progress.position);

    // Only scroll if sequence changed and we have a valid sequence
    if (currentSequence !== null && currentSequence !== lastSequenceRef.current) {
      lastSequenceRef.current = currentSequence;
      scrollToSequence(currentSequence);
    }
  }, [progress?.position, isPlaying, isAudioSyncScroll, webViewRef, baniID, artistID]);

  // Reset when sync scroll is disabled or audio stops
  useEffect(() => {
    if (!isAudioSyncScroll || !isPlaying || baniID !== 2 || artistID !== 4) {
      lastSequenceRef.current = null;
      isScrollingRef.current = false;
    }
  }, [isAudioSyncScroll, isPlaying, baniID, artistID]);

  return {
    currentSequence: findCurrentSequence(progress?.position || 0),
    isScrollingEnabled: isAudioSyncScroll && isPlaying,
  };
};

export default useAudioSyncScroll;
