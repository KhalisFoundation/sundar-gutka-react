import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import fetchLRCData from "../../utils/fetchLRC";

const useAudioSyncScroll = (progress, isPlaying, webViewRef, lyricsUrl, seekSyncRequest = null) => {
  // Large remote-stream seeks can take 3-5 s for progress.position to reflect
  // the new target. Guard must outlast the worst-case buffering delay.
  const SEEK_PROGRESS_SETTLE_MS = 5000;
  const SEEK_PROGRESS_TOLERANCE_SEC = 2.5;
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const isAudioSyncScrollRef = useRef(isAudioSyncScroll);
  isAudioSyncScrollRef.current = isAudioSyncScroll;
  const isParagraphMode = useSelector((state) => state.isParagraphMode);
  const lastSequenceRef = useRef(null);
  const lastHandledSeekTokenRef = useRef(null);
  const seekGuardRef = useRef({
    active: false,
    targetPosition: null,
    targetSequence: null,
    expiresAt: 0,
  });
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const [baniLRC, setBaniLRC] = useState(null);

  // Load LRC data when audioUrl changes
  useEffect(() => {
    let isMounted = true;

    // Always clear any stale highlight when the track changes, before the
    // new LRC is available to drive a fresh sync-scroll sequence.
    if (webViewRef?.current?.postMessage) {
      try {
        webViewRef.current.postMessage(JSON.stringify({ resetHighlight: true }));
      } catch (_) {}
    }

    // Clear stale LRC data immediately so the old track's timestamps cannot
    // drive a scrollToSequence call during the async window before the new
    // data resolves. Without this, the transition from full→short Chaupai
    // Sahib keeps the old baniLRC active for one render cycle and can cause
    // the last line of the previous track to be highlighted at the start of
    // the new one.
    setBaniLRC(null);
    lastSequenceRef.current = null;

    if (!lyricsUrl || !isAudioSyncScroll) {
      return undefined;
    }

    fetchLRCData(lyricsUrl).then((data) => {
      if (isMounted) {
        setBaniLRC(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [lyricsUrl, isAudioSyncScroll]);


  // Find current sequence based on audio progress.
  // LRC entries are sorted by start time, so we can binary-search instead of
  // scanning linearly on every playback tick — O(log n) vs O(n).
  const findCurrentSequence = (currentTime) => {
    if (currentTime == null || !baniLRC || !Array.isArray(baniLRC)) {
      return null;
    }

    let lo = 0;
    let hi = baniLRC.length - 1;
    while (lo <= hi) {
      // eslint-disable-next-line no-bitwise
      const mid = (lo + hi) >>> 1;
      const ts = baniLRC[mid];
      if (currentTime < ts.start) {
        hi = mid - 1;
      } else if (currentTime > ts.end) {
        lo = mid + 1;
      } else {
        return {
          currentSequence: ts.sequence,
          timeOut: (ts.end - ts.start) * 1000,
        };
      }
    }

    // If we are before the very first sequence, don't highlight anything yet.
    // This fixes the issue where a sequence starting at >0s gets incorrectly
    // highlighted starting from 0:00.
    if (hi < 0) {
      return {
        currentSequence: null,
        timeOut: 0,
      };
    }

    // If there is no exact timestamp hit (common around tiny timing gaps),
    // anchor to the nearest previous line so sync never gets stuck after seek.
    const fallbackIndex = lo >= baniLRC.length ? baniLRC.length - 1 : hi;
    const fallback = baniLRC[fallbackIndex];
    if (!fallback) {
      return {
        currentSequence: null,
        timeOut: 1000,
      };
    }

    return {
      currentSequence: fallback.sequence,
      timeOut: Math.max(120, (fallback.end - fallback.start) * 1000),
    };
  };

  // Scroll to specific sequence in WebView
  const scrollToSequence = (sequence, timeOut, options = {}) => {
    const { force = false, behavior = "auto" } = options;

    if (!isAudioSyncScrollRef.current || !webViewRef?.current?.postMessage || !sequence) {
      return false;
    }

    // Validate sequence is a safe positive integer
    const sequenceNumber = Number(sequence);
    if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
      // Invalid sequence - fail silently to prevent XSS
      return false;
    }

    try {
      // If a scroll is already in-flight, do not clear its unlock timer.
      // Clearing first and then returning would leave the lock stuck forever.
      if (isScrollingRef.current && !force) {
        return false;
      }

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      if (force) {
        isScrollingRef.current = false;
      }

      // Prevent multiple rapid scroll calls
      if (isScrollingRef.current) return false;
      isScrollingRef.current = true;

      const scrollMessage = {
        action: "scrollToSequence",
        sequence: sequenceNumber,
        behavior,
        timeout: timeOut,
        isParagraphMode,
      };

      webViewRef.current.postMessage(JSON.stringify(scrollMessage));

      // Reset scrolling flag after a short delay
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        scrollTimeoutRef.current = null;
      }, force ? 80 : 150);
      return true;
    } catch (error) {
      isScrollingRef.current = false;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      return false;
    }
  };

  // Main effect to handle sync scrolling
  useEffect(() => {
    // Only proceed if sync scroll is enabled and audio is playing
    if (!isAudioSyncScroll || !isPlaying || progress?.position == null || !baniLRC) {
      return;
    }

    // After a manual seek, ignore transient old-position progress ticks until
    // playback timeline catches up to the requested seek target.
    const guard = seekGuardRef.current;
    if (guard.active) {
      const now = Date.now();
      const isGuardExpired = now > guard.expiresAt;
      const targetPosition = Number(guard.targetPosition);
      const isNearSeekTarget =
        Number.isFinite(targetPosition) &&
        Math.abs(progress.position - targetPosition) <= SEEK_PROGRESS_TOLERANCE_SEC;

      if (!isGuardExpired && !isNearSeekTarget) {
        // Still waiting for progress to converge — skip this stale tick.
        return;
      }

      // Guard is lifting. Deactivate it first.
      seekGuardRef.current = {
        active: false,
        targetPosition: null,
        targetSequence: null,
        expiresAt: 0,
      };

      // When the guard expires by clock timeout (position never converged to the
      // seek target — common on slow remote streams), force-scroll to wherever
      // progress has settled right now rather than waiting for the next tick.
      if (isGuardExpired && !isNearSeekTarget) {
        const syncResult = findCurrentSequence(progress.position);
        if (syncResult?.currentSequence && syncResult.currentSequence !== lastSequenceRef.current) {
          const didScroll = scrollToSequence(syncResult.currentSequence, syncResult.timeOut, {
            force: true,
            behavior: "auto",
          });
          if (didScroll) {
            lastSequenceRef.current = syncResult.currentSequence;
          }
        }
        return;
      }
    }

    const { currentSequence, timeOut } = findCurrentSequence(progress.position);

    // Only scroll if sequence changed and we have a valid sequence
    if (currentSequence !== null && currentSequence !== lastSequenceRef.current) {
      const didScroll = scrollToSequence(currentSequence, timeOut);
      if (didScroll) {
        lastSequenceRef.current = currentSequence;
      }
    }
  }, [progress?.position, isPlaying, isAudioSyncScroll, webViewRef, baniLRC]);

  // Seek-triggered sync: force an immediate jump to the target sequence so
  // rapid slider seeks don't get dropped by in-flight smooth-scroll throttling.
  useEffect(() => {
    if (!isAudioSyncScroll || !baniLRC || !seekSyncRequest) {
      return;
    }

    const seekToken = seekSyncRequest.ts;
    if (!seekToken || seekToken === lastHandledSeekTokenRef.current) {
      return;
    }
    lastHandledSeekTokenRef.current = seekToken;

    const lookup = findCurrentSequence(seekSyncRequest.position);
    const targetSequence = lookup?.currentSequence ?? null;

    seekGuardRef.current = {
      active: true,
      targetPosition: seekSyncRequest.position,
      targetSequence,
      expiresAt: Date.now() + SEEK_PROGRESS_SETTLE_MS,
    };

    if (!targetSequence) {
      return;
    }

    const didScroll = scrollToSequence(targetSequence, lookup.timeOut, {
      force: true,
      behavior: "auto",
    });
    if (didScroll) {
      lastSequenceRef.current = targetSequence;
    }
  }, [seekSyncRequest, isAudioSyncScroll, baniLRC]);

  // Sync scroll state cleanup when audio stops or sync is disabled.
  useEffect(() => {
    if (!isAudioSyncScroll || !isPlaying || !baniLRC) {
      lastSequenceRef.current = null;
      isScrollingRef.current = false;
      seekGuardRef.current = {
        active: false,
        targetPosition: null,
        targetSequence: null,
        expiresAt: 0,
      };
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      if (webViewRef?.current?.postMessage) {
        try {
          if (!isPlaying && isAudioSyncScroll && baniLRC) {
            // Audio paused while still on the audio screen — cancel the
            // auto-clear timeout so the highlight stays visible, but don't
            // wipe it. It clears when the user leaves the audio screen.
            webViewRef.current.postMessage(JSON.stringify({ freezeHighlight: true }));
          } else {
            // Sync scroll disabled or lyrics unavailable — clear highlight.
            webViewRef.current.postMessage(JSON.stringify({ resetHighlight: true }));
          }
        } catch (_) {}
      }
    }
  }, [isAudioSyncScroll, isPlaying, baniLRC]);

  // Clear highlight instantly when the audio player closes (unmounts).
  // Fires for any exit path: X button, Read nav tap, bani length change, etc.
  useEffect(() => {
    return () => {
      if (webViewRef?.current?.postMessage) {
        try {
          webViewRef.current.postMessage(JSON.stringify({ resetHighlight: true }));
        } catch (_) {}
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup scroll timeout on unmount
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
