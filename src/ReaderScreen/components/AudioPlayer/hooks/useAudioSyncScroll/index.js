import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import fetchLRCData from "../../utils/fetchLRC";

const useAudioSyncScroll = (progress, isPlaying, webViewRef, lyricsUrl) => {
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const isParagraphMode = useSelector((state) => state.isParagraphMode);
  const lastSequenceRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const [baniLRC, setBaniLRC] = useState(null);

  // Load LRC data when audioUrl changes
  useEffect(() => {
    let isMounted = true;

    if (!lyricsUrl || !isAudioSyncScroll) {
      setBaniLRC(null);
      return undefined;
    }

    if (isAudioSyncScroll && lyricsUrl) {
      fetchLRCData(lyricsUrl).then((data) => {
        if (isMounted) {
          setBaniLRC(data);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [lyricsUrl, isAudioSyncScroll]);

  // Find current sequence based on audio progress
  const findCurrentSequence = (currentTime) => {
    if (!currentTime || !baniLRC || !Array.isArray(baniLRC)) {
      return null;
    }

    // Find the timestamp entry that contains the current time
    const currentTimestamp = baniLRC.find(
      (timestamp) => currentTime >= timestamp.start && currentTime <= timestamp.end
    );

    return {
      currentSequence: currentTimestamp ? currentTimestamp.sequence : null,
      timeOut: currentTimestamp ? (currentTimestamp.end - currentTimestamp.start) * 1000 : 1000, // convert to milliseconds
    };
  };

  // Scroll to specific sequence in WebView
  const scrollToSequence = (sequence, timeOut) => {
    if (!webViewRef?.current?.postMessage || !sequence) {
      return;
    }

    // Validate sequence is a safe positive integer
    const sequenceNumber = Number(sequence);
    if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
      // Invalid sequence - fail silently to prevent XSS
      return;
    }

    try {
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Prevent multiple rapid scroll calls
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;

      const scrollMessage = {
        action: "scrollToSequence",
        sequence: sequenceNumber,
        behavior: "smooth", // smooth scrolling
        timeout: timeOut,
        isParagraphMode,
      };

      webViewRef.current.postMessage(JSON.stringify(scrollMessage));

      // Reset scrolling flag after a short delay
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        scrollTimeoutRef.current = null;
      }, 500);
    } catch (error) {
      isScrollingRef.current = false;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    }
  };

  // Main effect to handle sync scrolling
  useEffect(() => {
    // Only proceed if sync scroll is enabled and audio is playing
    if (!isAudioSyncScroll || !isPlaying || !progress?.position || !baniLRC) {
      return;
    }
    const { currentSequence, timeOut } = findCurrentSequence(progress.position);

    // Only scroll if sequence changed and we have a valid sequence
    if (currentSequence !== null && currentSequence !== lastSequenceRef.current) {
      lastSequenceRef.current = currentSequence;
      scrollToSequence(currentSequence, timeOut);
    }
  }, [progress?.position, isPlaying, isAudioSyncScroll, webViewRef, baniLRC]);

  // Reset when sync scroll is disabled or audio stops
  useEffect(() => {
    if (!isAudioSyncScroll || !isPlaying || !baniLRC) {
      lastSequenceRef.current = null;
      isScrollingRef.current = false;
      // Clear any pending timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    }
  }, [isAudioSyncScroll, isPlaying, baniLRC]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentSequence: findCurrentSequence(progress?.position || 0)?.currentSequence,
    isScrollingEnabled: isAudioSyncScroll && isPlaying,
  };
};

export default useAudioSyncScroll;
