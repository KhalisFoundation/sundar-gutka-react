import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

const useAudioSyncScroll = (progress, isPlaying, webViewRef, audioUrl) => {
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const lastSequenceRef = useRef(null);
  const isScrollingRef = useRef(false);
  const [baniLRC, setBaniLRC] = useState(null);

  // Function to fetch JSON file content
  const fetchLRCData = async (jsonUrl) => {
    try {
      const response = await fetch(jsonUrl);

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Load LRC data when audioUrl changes
  useEffect(() => {
    if (!audioUrl) {
      setBaniLRC(null);
      return;
    }

    const jsonUrl = audioUrl.replace(".mp3", ".json");
    fetchLRCData(jsonUrl).then((data) => {
      setBaniLRC(data);
    });
  }, [audioUrl]);

  // Find current sequence based on audio progress
  const findCurrentSequence = (currentTime) => {
    if (!currentTime || !baniLRC || !Array.isArray(baniLRC)) {
      return null;
    }

    // Find the timestamp entry that contains the current time
    const currentTimestamp = baniLRC.find(
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
      isScrollingRef.current = false;
    }
  };

  // Main effect to handle sync scrolling
  useEffect(() => {
    // Only proceed if sync scroll is enabled and audio is playing
    if (!isAudioSyncScroll || !isPlaying || !progress?.position || !baniLRC) {
      return;
    }
    const currentSequence = findCurrentSequence(progress.position);

    // Only scroll if sequence changed and we have a valid sequence
    if (currentSequence !== null && currentSequence !== lastSequenceRef.current) {
      lastSequenceRef.current = currentSequence;
      scrollToSequence(currentSequence);
    }
  }, [progress?.position, isPlaying, isAudioSyncScroll, webViewRef, baniLRC]);

  // Reset when sync scroll is disabled or audio stops
  useEffect(() => {
    if (!isAudioSyncScroll || !isPlaying || !baniLRC) {
      lastSequenceRef.current = null;
      isScrollingRef.current = false;
    }
  }, [isAudioSyncScroll, isPlaying, baniLRC]);

  return {
    currentSequence: findCurrentSequence(progress?.position || 0),
    isScrollingEnabled: isAudioSyncScroll && isPlaying,
  };
};

export default useAudioSyncScroll;
