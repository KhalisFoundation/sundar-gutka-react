import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ActivityIndicator, AppState, Platform, View, Animated, NativeModules } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  constant,
  actions,
  logError,
  SafeArea,
  BottomNavigation,
  useTheme,
  useThemedStyles,
  StatusBarComponent,
  useBackHandler,
  showInfoToast,
  STRINGS,
  trackScrollProgress,
  trackNavBar,
} from "@common";
import { Header, AutoScrollComponent, AudioPlayer } from "./components";
import { useBookmarks, useFetchShabad } from "./hooks";
import createStyles from "./styles";
import { loadHTML } from "./utils";
import { pauseTrack } from "@common/TrackPlayerUtils";

// How long the bars linger with no interaction before auto-hiding during auto-scroll.
const BARS_IDLE_HIDE_MS = 4000;

const Reader = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const bookmarkPosition = useSelector((state) => state.bookmarkPosition);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
  const isAudio = useSelector((state) => state.isAudio);
  const isAudioFeatureEnabled = useSelector((state) => state.isAudioFeatureEnabled);
  const isAudioFeatureOn = isAudioFeatureEnabled ?? true;
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const fontSize = useSelector((state) => state.fontSize);
  const fontFace = useSelector((state) => state.fontFace);
  const isLarivaar = useSelector((state) => state.isLarivaar);
  const isLarivaarAssist = useSelector((state) => state.isLarivaarAssist);
  const isEnglishTranslation = useSelector((state) => state.isEnglishTranslation);
  const isPunjabiTranslation = useSelector((state) => state.isPunjabiTranslation);
  const isSpanishTranslation = useSelector((state) => state.isSpanishTranslation);
  const isParagraphMode = useSelector((state) => state.isParagraphMode);
  const isVishraam = useSelector((state) => state.isVishraam);
  const vishraamOption = useSelector((state) => state.vishraamOption);
  const savePosition = useSelector((state) => state.savePosition);
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);

  const webViewRef = useRef(null);
  const { webView } = styles;
  const { title, id, titleUni } = route.params.params || {};
  const [isHeader, toggleHeader] = useState(false);
  const [viewLoaded, toggleViewLoaded] = useState(false);
  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);
  const [dateKey, setDateKey] = useState(Date.now().toString());
  // Counter that increments on every WebView load — passed to AutoScrollComponent
  // so it can re-send the scroll command after a WKWebView remount (iOS drops
  // postMessages sent to a stale WebView instance).
  const [webViewLoadTick, setWebViewLoadTick] = useState(0);
  const [titleText, setTitleText] = useState(null);
  const readSavedPosition = (entry) => {
    if (!entry) return { elementId: null, sequence: null };
    if (typeof entry === "string") return { elementId: entry, sequence: null };
    if (typeof entry === "object") {
      return { elementId: entry.elementId || null, sequence: entry.sequence || null };
    }
    return { elementId: null, sequence: null };
  };
  const initialSaved = readSavedPosition(savePosition[id]);
  const currentElementIdRef = useRef(initialSaved.elementId);
  const currentSequenceRef = useRef(initialSaved.sequence);

  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(id);
  const { bottom: insetBottom } = useSafeAreaInsets();

  // Animated progress value — driven by ref to avoid re-renders on every scroll tick
  const scrollProgressAnim = useRef(new Animated.Value(0)).current;
  // Latest scroll % (0-100) for analytics — updated on every WebView scroll message
  const scrollPercentRef = useRef(0);

  // Footprint of the bottom-nav overlay (nav height + the 5px progress track that
  // sits on top of it). The audio player is lifted by exactly this much when the
  // bars are shown so it clears the nav.
  //
  // NOTE: the navbar keeps a FIXED height (theme.components.bottomNavigation.height)
  // on both platforms — the iOS home-indicator padding is applied INSIDE that fixed
  // height (it nudges the icons up, it does not grow the box). So the nav's real
  // footprint is exactly that height; adding the safe-area inset here overshot the
  // lift and left a visible gap between the nav and the reading-progress bar on iOS.
  const navChromeHeight = theme.components.bottomNavigation.height + 5;

  // The bottom chrome (scroll-progress bar + BottomNavigation) is an absolute
  // overlay pinned to the bottom of the screen. It slides in/out with a single
  // native-driver transform — NOT a JS-driven height animation — so toggling the
  // bars never resizes the flex WebView underneath. Resizing the WebView on every
  // animation frame was the low-end-Android jank source: reflow storms made the
  // bars appear laggily, and the JS-thread height animation desynced against the
  // nav's own native transform, flickering it in and out. Sliding an overlay
  // leaves nothing to reflow and runs entirely on the UI thread.
  const navSlideAnim = useRef(new Animated.Value(300)).current; // starts hidden (bars off)
  const navClusterHeightRef = useRef(0);

  // The audio player stays in flow (so it never covers the text) but rides with
  // the bars: it sits at the very bottom while reading and lifts above the nav
  // when the bars appear, dropping back down when they hide — the way it moved
  // before the overlay refactor. It's a native-driver transform, not a layout
  // change, so it never resizes the WebView.
  const audioLiftAnim = useRef(new Animated.Value(0)).current; // starts down (bars off)

  // The reading-progress bar rides its own transform and, unlike the nav, never
  // slides off screen: when the bars show it lifts to sit on top of the nav, and
  // when they hide it drops to the bottom edge of the screen (staying pinned there
  // even while the audio mini-player is up), so reading progress is always visible.
  // Base position is the bottom edge (translateY 0 = hidden resting spot).
  const progressLiftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const distance = navClusterHeightRef.current || 300;
    // When shown, lift to sit on top of the nav (nav height = navChromeHeight minus
    // the 5px progress track). When hidden, drop back to the bottom edge.
    const progressLift = isHeader ? -(navChromeHeight - 5) : 0;
    Animated.parallel([
      Animated.timing(navSlideAnim, {
        toValue: isHeader ? 0 : distance,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(audioLiftAnim, {
        toValue: isHeader ? -navChromeHeight : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(progressLiftAnim, {
        toValue: progressLift,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isHeader, navSlideAnim, audioLiftAnim, progressLiftAnim, navChromeHeight]);

  // iPad scroll guard: blocks spurious WebView scroll events during and shortly
  // after screen transitions (Bookmarks → Reader). WKWebView can fire scroll-to-0
  // events both while backgrounded AND during the return transition animation.
  const iPadScrollGuardRef = useRef(false);

  // Auto-hide the bars after a spell of inactivity while auto-scroll is running.
  // Both auto-scroll and audio are hands-off reads, so a tap that reveals the bars
  // should quietly fall away again if the user doesn't follow up — keeping the
  // immersive view (during audio the mini-player stays; only the header + nav go).
  // Any interaction (reading-area touch, speed-slider, audio controls) restarts the
  // countdown; it only applies while auto-scroll/audio is active and the bars are up.
  const barsIdleTimerRef = useRef(null);
  // Read live state from refs so the (stable) scheduler can be called from message
  // handlers and children without stale closures or re-renders on every touch.
  const isHeaderRef = useRef(isHeader);
  isHeaderRef.current = isHeader;
  const isAutoScrollRef = useRef(isAutoScroll);
  isAutoScrollRef.current = isAutoScroll;
  const isAudioActiveRef = useRef(isAudioFeatureOn && isAudio);
  isAudioActiveRef.current = isAudioFeatureOn && isAudio;

  // Single funnel for every bar show/hide so each visibility change fires exactly
  // one NAV_BAR_SHOW / NAV_BAR_HIDE analytics event with its trigger, and repeats
  // (e.g. "hide" posted on every scroll-down tick) are deduped. isHeaderRef is
  // nudged immediately so rapid repeats before the next render don't double-count.
  const setBarsVisible = useCallback((visible, trigger) => {
    if (isHeaderRef.current === visible) return;
    isHeaderRef.current = visible;
    toggleHeader(visible);
    let mode = "reading";
    if (isAutoScrollRef.current) mode = "autoscroll";
    else if (isAudioActiveRef.current) mode = "audio";
    trackNavBar(visible, trigger, mode);
  }, []);

  const clearBarsIdleTimer = useCallback(() => {
    if (barsIdleTimerRef.current) {
      clearTimeout(barsIdleTimerRef.current);
      barsIdleTimerRef.current = null;
    }
  }, []);

  const scheduleBarsIdleHide = useCallback(() => {
    clearBarsIdleTimer();
    if ((isAutoScrollRef.current || isAudioActiveRef.current) && isHeaderRef.current) {
      barsIdleTimerRef.current = setTimeout(() => {
        setBarsVisible(false, "auto_hide_idle");
      }, BARS_IDLE_HIDE_MS);
    }
  }, [clearBarsIdleTimer, setBarsVisible]);

  // Start/refresh the countdown whenever the bars are shown during auto-scroll or
  // audio, and tear it down when the bars hide, playback stops, or the screen
  // unmounts.
  useEffect(() => {
    scheduleBarsIdleHide();
    return clearBarsIdleTimer;
  }, [isHeader, isAutoScroll, isAudioFeatureOn, isAudio, scheduleBarsIdleHide, clearBarsIdleTimer]);

  const pauseAudioPlayback = useCallback(async () => {
    try {
      await pauseTrack();
    } catch (_) {
      // Best effort audio pause while leaving Reader.
    }
  }, []);

  // Save element ID when leaving screen or app goes to background
  const saveScrollPosition = useCallback(() => {
    const elementIdToSave = currentElementIdRef.current;
    const sequenceToSave = currentSequenceRef.current;
    if (elementIdToSave) {
      dispatch(actions.setPosition(elementIdToSave, id, sequenceToSave));
    }
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(actions.setCurrentBani({ id, title, titleUni }));
  }, [id, title, titleUni]);

  useEffect(() => {
    // Handle undefined titleUni gracefully - fallback to title if titleUni is not available
    const displayTitle = fontFace === constant.BALOO_PAAJI ? titleUni || title : title;
    setTitleText(displayTitle);
  }, [fontFace, titleUni, title]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Save position when component unmounts
      saveScrollPosition();
      pauseAudioPlayback();
    };
  }, [saveScrollPosition, pauseAudioPlayback]);

  useEffect(() => {
    const unsubscribeBlur = navigation.addListener("blur", () => {
      pauseAudioPlayback();
      trackScrollProgress(id, titleUni || title, scrollPercentRef.current, isAudioSyncScroll);
      // iPad: Activate scroll guard when leaving the screen. WKWebView can
      // trigger a layout recalculation that resets scrollY to 0 while the
      // Reader is backgrounded, then again during the return transition.
      if (Platform.OS === "ios") {
        iPadScrollGuardRef.current = true;
      }
    });

    return unsubscribeBlur;
  }, [navigation, pauseAudioPlayback, id, titleUni, title, isAudioSyncScroll]);

  // iPad: Restore WebView scroll position when returning from Bookmarks.
  // The scroll guard stays active for a grace period after focus so that
  // spurious scroll events fired during the transition animation are also
  // blocked. The guard is cleared after the WebView has had time to
  // process the scrollToPosition message.
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const unsubscribeFocus = navigation.addListener("focus", () => {
      if (!iPadScrollGuardRef.current) return;

      // Restore position — the WebView may have scrolled to 0 while backgrounded
      if (webViewRef.current && currentElementIdRef.current) {
        const scrollMessage = {
          action: "scrollToPosition",
          elementId: currentElementIdRef.current,
          sequence: currentSequenceRef.current,
        };
        webViewRef.current.postMessage(JSON.stringify(scrollMessage));
      }

      // Keep the guard active for 800ms to block scroll events that fire
      // during the navigation transition animation
      setTimeout(() => {
        iPadScrollGuardRef.current = false;
      }, 800);
    });

    return unsubscribeFocus;
  }, [navigation]);

  // Memoize WebView key to prevent unnecessary remounts
  const webViewKey = useMemo(() => {
    return `${id}-${isParagraphMode}-${isLarivaar}-${isLarivaarAssist}-${isVishraam}-${vishraamOption}-${dateKey}`;
  }, [id, isParagraphMode, isLarivaar, isLarivaarAssist, isVishraam, vishraamOption, dateKey]);

  // Memoize WebView source to prevent unnecessary remounts
  const webViewSource = useMemo(() => {
    return {
      html: loadHTML(
        shabad,
        isTransliteration,
        fontSize,
        fontFace,
        isEnglishTranslation,
        isPunjabiTranslation,
        isSpanishTranslation,
        theme,
        isLarivaar
      ),
      baseUrl: Platform.OS === "ios" ? "./" : "",
    };
  }, [
    shabad,
    isTransliteration,
    fontSize,
    fontFace,
    isEnglishTranslation,
    isPunjabiTranslation,
    isSpanishTranslation,
    theme,
    isLarivaar,
  ]);

  useBookmarks(webViewRef, shabad, bookmarkPosition);

  // Handle app state changes
  useEffect(() => {
    let isMounted = true;
    const subscription = AppState.addEventListener("change", (state) => {
      if (!isMounted) return;

      if (state === "active") {
        // App came to foreground
      } else if (state === "background") {
        // App went to background - save scroll position
        saveScrollPosition();
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [saveScrollPosition]);

  // Set currentElementId from savePosition when it changes
  useEffect(() => {
    if (savePosition && id && savePosition[id]) {
      const saved = savePosition[id];
      if (typeof saved === "number" && saved > 0.9) {
        // Old numeric format — reset if at end of doc
        currentElementIdRef.current = null;
        return;
      }
      const { elementId, sequence } = readSavedPosition(saved);
      currentElementIdRef.current = elementId;
      currentSequenceRef.current = sequence;
    }
  }, [savePosition, id]);

  const handleBackPress = useCallback(() => {
    // Save position before navigating back
    saveScrollPosition();
    pauseAudioPlayback();
    if (webViewRef?.current) {
      navigation.goBack();
    }
    return true;
  }, [saveScrollPosition, navigation, pauseAudioPlayback]);

  useBackHandler(handleBackPress);

  const handleBookmarkPress = useCallback(() => {
    navigation.navigate(constant.BOOKMARKS, { id });
  }, [navigation, id]);

  const handleMessage = useCallback(
    (message) => {
      // Update last activity timestamp
      const { data } = message.nativeEvent;

      // GUARD: On iOS, navigating away (e.g. to Bookmarks) can trigger a WKWebView
      // layout recalculation that resets scrollY to 0. This fires spurious scroll
      // events both while backgrounded AND during the return transition animation.
      // The ref-based guard (set on blur, cleared 800ms after focus) blocks all
      // scroll-derived messages during this window.
      if (iPadScrollGuardRef.current) {
        if (
          data === "show" ||
          data === "hide" ||
          data.includes("scroll-elementId-") ||
          data.startsWith("scroll-progress-")
        ) {
          return;
        }
      }

      // Handle UI messages. A tap inside the WebView posts "toggle" (tap
      // detection lives in gutkaScript so scroll gestures never toggle).
      // Scrolling down posts "hide", scrolling up posts "show".
      if (data === "toggle") {
        setBarsVisible(!isHeaderRef.current, "tap");
      } else if (data === "activity") {
        // A touch on the reading area during auto-scroll/audio — restart the idle
        // countdown so the bars don't hide out from under an engaged user.
        scheduleBarsIdleHide();
      } else if (data === "show") {
        setBarsVisible(true, "scroll_up");
      } else if (data === "hide") {
        setBarsVisible(false, "scroll_down");
      } else if (data.includes("scroll-elementId-")) {
        // Capture element ID (and optional sequence) from WebView scroll events
        const payload = data.split("scroll-elementId-")[1];
        const [elementId, seqPart] = payload.split("|seq-");
        const sequence = seqPart || null;
        currentElementIdRef.current = elementId;
        currentSequenceRef.current = sequence;
        // Save immediately when element ID changes
        dispatch(actions.setPosition(elementId, id, sequence));
        if (shouldNavigateBack) {
          navigation.goBack();
          setShouldNavigateBack(false);
        }
      } else if (data.includes("sequenceString-")) {
        const sequenceStringData = data.split("-")[1];
        dispatch(actions.setBookmarkSequenceString(sequenceStringData));
      } else if (data.startsWith("scroll-progress-")) {
        const pct = parseFloat(data.split("scroll-progress-")[1]);
        if (Number.isFinite(pct)) {
          Animated.timing(scrollProgressAnim, {
            toValue: pct,
            duration: 0,
            useNativeDriver: true,
          }).start();
          scrollPercentRef.current = Math.round(pct * 100);
        }
      }
    },
    [dispatch, id, navigation, shouldNavigateBack, scheduleBarsIdleHide, setBarsVisible]
  );

  const handleLoadStart = useCallback(() => {
    setTimeout(() => {
      toggleViewLoaded(true);
    }, 100);
  }, []);

  const handleLoadEnd = useCallback(() => {
    // Scroll to saved element ID after WebView is fully loaded
    if (webViewRef.current && currentElementIdRef.current) {
      const scrollMessage = {
        action: "scrollToPosition",
        elementId: currentElementIdRef.current,
        sequence: currentSequenceRef.current,
      };
      webViewRef.current.postMessage(JSON.stringify(scrollMessage));
    }

    // iPad fix: Disable the native iOS "tap status bar to scroll to top"
    // gesture on this WebView. On iPad, the touch target extends into the
    // app header, causing scroll resets when tapping back/title/bookmark.
    // Uses the custom WebViewScrollFixer native module (ios/WebViewScrollFixer.m)
    // so we don't need to patch react-native-webview.
    if (Platform.OS === "ios" && NativeModules.WebViewScrollFixer) {
      NativeModules.WebViewScrollFixer.disableScrollsToTop();
    }

    // Signal AutoScrollComponent that a fresh WebView is ready AFTER a short
    // delay so the scrollToPosition message above has time to execute in the
    // WebView. Without this, auto-scroll resumes from the top of the page.
    setTimeout(() => {
      setWebViewLoadTick((prev) => prev + 1);
    }, 500);
  }, []);

  const handleError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    logError(`Reader web View Error ${nativeEvent}`);
  }, []);

  const handleHttpError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    logError("HTTP error status code:", nativeEvent.statusCode);
  }, []);

  const reloadWebView = useCallback(() => {
    if (webViewRef.current) {
      // FEAT-06: Notify user and regenerate key — scroll restore happens in handleLoadEnd
      if (STRINGS.RELOADING_BANI) {
        showInfoToast(STRINGS.RELOADING_BANI);
      }
      setDateKey(Date.now().toString());
    }
  }, []);

  return (
    <SafeArea backgroundColor={theme.colors.surface} edges={["left", "right"]}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      <Header
        title={titleText}
        handleBackPress={handleBackPress}
        handleBookmarkPress={handleBookmarkPress}
        isHeader={isHeader}
      />
      {isLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
      <WebView
        key={webViewKey}
        webviewDebuggingEnabled={__DEV__}
        javaScriptEnabled
        originWhitelist={["*"]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        ref={webViewRef}
        onError={handleError}
        onHttpError={handleHttpError}
        decelerationRate={0.998}
        scrollEnabled
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled
        showsVerticalScrollIndicator
        showsHorizontalScrollIndicator={false}
        onContentProcessDidTerminate={reloadWebView}
        source={webViewSource}
        backgroundColor={theme.colors.surface}
        style={[
          webView,
          theme.mode === "dark" && { opacity: viewLoaded ? 1 : 0.1 },
          { backgroundColor: theme.colors.surface, marginTop: 60 },
        ]}
        onMessage={handleMessage}
      />
      {isAudioFeatureOn && isAudio && (
        <Animated.View
          style={{ transform: [{ translateY: audioLiftAnim }] }}
          // Touching the audio controls (seek, play/pause, tracks) counts as
          // activity — restart the idle countdown so the bars, and with them the
          // lifted player, don't drop away mid-interaction.
          onTouchStart={scheduleBarsIdleHide}
          onTouchMove={scheduleBarsIdleHide}
        >
          <AudioPlayer baniID={id} title={titleText} notificationTitle={titleUni || titleText} webViewRef={webViewRef} />
        </Animated.View>
      )}
      {isAutoScroll && (
        <View style={[styles.autoScrollFixedView, { bottom: styles.autoScrollFixedView.bottom + insetBottom, display: isHeader ? "flex" : "none" }]}>
          <AutoScrollComponent shabadID={id} webViewRef={webViewRef} webViewLoadTick={webViewLoadTick} onActivity={scheduleBarsIdleHide} />
        </View>
      )}


      {/* Bottom nav overlay — pinned to the bottom and slid out of view via a
          single native-driver transform, so showing/hiding it never resizes the
          WebView. The reading-progress bar is intentionally NOT inside this overlay
          (see below) so it stays visible when the nav hides. */}
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0) {
            navClusterHeightRef.current = h;
            // Snap to the exact off-screen distance on first measure so the initial
            // hidden state (bars start off) lands precisely with no visible flash.
            if (!isHeader) navSlideAnim.setValue(h);
          }
        }}
        style={[styles.bottomChrome, { transform: [{ translateY: navSlideAnim }] }]}
      >
        <BottomNavigation activeKey={isAudioFeatureOn && isAudio ? "Music" : "Read"} />
      </Animated.View>

      {/* Reading-progress bar — a separate bottom-pinned layer that never hides.
          It lifts to sit on top of the nav when the bars show, and drops to the
          bottom edge (or just above the mini-player during audio) when they hide,
          so reading progress is always visible. pointerEvents none so the thin
          bar never intercepts taps meant for the nav/mini-player beneath it. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.scrollProgressBar, { transform: [{ translateY: progressLiftAnim }] }]}
      >
        <Animated.View
          style={[
            styles.scrollProgressFill,
            { transform: [{ scaleX: scrollProgressAnim }] },
          ]}
        />
      </Animated.View>
    </SafeArea>
  );
};

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default React.memo(Reader);
