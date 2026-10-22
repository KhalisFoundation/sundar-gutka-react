import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ActivityIndicator, AppState, Platform, View, Animated, NativeModules } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useDispatch, useSelector } from "react-redux";
import { bottomNavInset } from "@theme/components";
import { useReaderTheme } from "@theme/reader";
import PropTypes from "prop-types";
import WebViewUnavailable from "@common/components/WebViewUnavailable";
import { foldableTopSpace, useFoldableInsetTop } from "@common/deviceForm";
import { useNavBarSurface } from "@common/systemBars";
import { pauseTrack } from "@common/TrackPlayerUtils";
import { useWebViewAvailable } from "@common/webViewAvailability";
import {
  constant,
  convertToUnicode,
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
import { readerTopLayout } from "./utils/topLayout";

// How long the bars linger with no interaction before auto-hiding during auto-scroll.
const BARS_IDLE_HIDE_MS = 4000;

// Window after a bookmark jump during which the iOS focus-restore below stands
// down, so it cannot scroll the reader back to where it was before Bookmarks
// was opened.
const BOOKMARK_JUMP_GRACE_MS = 1500;

const Reader = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  // The page, its ground and the reading chrome follow the READING theme. Its
  // light/dark records take the ground from `c.backgroundAlt`, so following the
  // app keeps the Reader matching every other screen.
  const { theme: readerTheme } = useReaderTheme();
  const readerBgColor = readerTheme.background.color;
  // Android cannot always create a WebView (provider disabled, uninstalled or
  // mid-update); mounting one then kills the process before any boundary sees
  // it. So the page is mounted only once the probe has said yes, and the notice
  // takes its place when the answer is no.
  const { available: webViewAvailable, recheck: recheckWebView } = useWebViewAvailable();
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
  // Chrome up, the system navigation bar sits on the dark bottom bar; chrome
  // away, it sits on the bani page, whose lightness is the reading theme's.
  useNavBarSurface(isHeader ? false : readerTheme.base !== "dark");
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
  // Where the page starts and how far its first line sits below that. Fixed on
  // every phone that does not fold; a foldable gives back what its cutout does
  // not need. See topLayout.js.
  const foldableInsetTop = useFoldableInsetTop();
  // How far the floating header covers the page. The header is absolutely
  // positioned so it can slide away, which means the top of the WebView viewport
  // sits BEHIND it, and a restore that scrolls a line to "top of viewport" parks
  // it under the header. Restores offset by this instead. Built from the same
  // two tokens as the header itself, so they cannot drift.
  const headerTopClearance =
    foldableInsetTop === null
      ? theme.layout.header.topClearance
      : foldableTopSpace(foldableInsetTop, theme.layout.header.topClearance);
  const headerOverlayHeight = headerTopClearance + theme.layout.header.minHeight;
  const { webViewTop, pageTopMargin } = readerTopLayout({
    foldableInsetTop,
    headerTopClearance: theme.layout.header.topClearance,
  });
  // The margin the HTML is built with, read through a ref so that a change to
  // it alone does not rebuild the page — see the setTopMargin effect below.
  const pageTopMarginRef = useRef(pageTopMargin);
  pageTopMarginRef.current = pageTopMargin;

  // Animated progress value — driven by ref to avoid re-renders on every scroll tick
  const scrollProgressAnim = useRef(new Animated.Value(0)).current;
  // Latest scroll % (0-100) for analytics — updated on every WebView scroll message
  const scrollPercentRef = useRef(0);

  // Bottom-nav overlay footprint (nav height + the 5px progress track on top,
  // plus the bottom safe-area inset). The audio player is lifted by exactly
  // this much when the bars show so it clears the nav.
  //
  // The inset is part of the footprint because `BottomNavigation` pads it, so
  // the bar on screen is that much taller than its own height token whenever the
  // system navigation bar is drawn.
  //
  // `bottomNavInset` rather than the raw inset: on iOS the bar pads only up to
  // its cap, so adding all 34pt here would lift this chrome off the bar's top
  // edge by the 14 the cap trimmed. On Android the helper returns the inset
  // unchanged.
  const navChromeHeight =
    theme.components.bottomNavigation.height + 5 + bottomNavInset(insetBottom);

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

  // When the last bookmark jump was posted to the WebView. Tapping a bookmark
  // dispatches the position and pops back in one go, so the focus listener
  // below fires on the same commit as the jump — without this it restores the
  // pre-Bookmarks position and undoes it. iOS only: the whole listener is
  // skipped on Android.
  const bookmarkJumpAtRef = useRef(0);

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

  // How much of the PAGE the header covers right now, for a restore to clear.
  // The WebView already starts `webViewTop` below the screen's top, so the
  // header hides only what it reaches past that — and nothing at all while it
  // is hidden, which is how a bani opens here. Over-clearing parked the line
  // lower on screen, and the next position report saved the earlier line now
  // at the top, so every open walked the position back.
  const restoreTopInset = useCallback(
    () => (isHeaderRef.current ? Math.max(0, headerOverlayHeight - webViewTop) : 0),
    [headerOverlayHeight, webViewTop]
  );
  const isAutoScrollRef = useRef(isAutoScroll);
  isAutoScrollRef.current = isAutoScroll;
  const isAudioActiveRef = useRef(isAudioFeatureOn && isAudio);
  isAudioActiveRef.current = isAudioFeatureOn && isAudio;
  // True while the page rests at the very top or end of the bani, where the
  // bars stay up (see the "edge" message) and the idle auto-hide stands down.
  const atEdgeRef = useRef(false);

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
    if (
      (isAutoScrollRef.current || isAudioActiveRef.current) &&
      isHeaderRef.current &&
      !atEdgeRef.current
    ) {
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

  // A fresh bani starts away from the edge; the previous bani's state must not
  // keep the idle auto-hide standing down.
  useEffect(() => {
    atEdgeRef.current = false;
  }, [id]);

  // Bottom inset for the WebView content. Whenever the bars are visible they
  // overlay the bottom navChromeHeight strip of the viewport, hiding the last
  // few lines, so reserve that much scrollable space at the end of the content
  // so the last line can scroll clear. Re-applied on webViewLoadTick so it
  // survives a WebView reload. Driven by message (not baked into the HTML) so it
  // never reflows/reloads the page.
  useEffect(() => {
    if (!webViewRef.current) return;
    webViewRef.current.postMessage(
      JSON.stringify({ action: "setBottomInset", value: navChromeHeight })
    );
  }, [navChromeHeight, webViewLoadTick]);

  // A foldable's page margin follows its top inset, which changes when it is
  // folded or unfolded. Sent by message rather than rebuilt into the HTML: a
  // rebuild reloads the page, and the reload lost the reader's line. Every other
  // phone's margin never changes, so nothing is ever sent there.
  useEffect(() => {
    if (foldableInsetTop === null || !webViewRef.current) return;
    webViewRef.current.postMessage(
      JSON.stringify({ action: "setTopMargin", value: pageTopMargin })
    );
  }, [foldableInsetTop, pageTopMargin, webViewLoadTick]);

  // The header title, always Unicode. The header draws it in the UI face
  // (Baloo), which renders Unicode Gurmukhi but not the ASCII-mapped
  // `gurmukhi` name, so the Unicode name is preferred outright and the ASCII
  // name is converted when no Unicode name exists.
  useEffect(() => {
    setTitleText(titleUni || convertToUnicode(title));
  }, [titleUni, title]);
  // The audio player is still dev's until the audio PR: its track dialog draws
  // the title in the bani font, so it keeps the title it has always had (ASCII
  // for the ASCII-mapped faces), and its analytics keep the same values.
  const playerTitle = fontFace === constant.BALOO_PAAJI ? titleUni || title : title;

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
      // The position lives in refs while reading (see handleMessage), so leaving
      // for Bookmarks, Settings or Home writes it here.
      saveScrollPosition();
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
  }, [navigation, saveScrollPosition, pauseAudioPlayback, id, titleUni, title, isAudioSyncScroll]);

  // iPad: Restore WebView scroll position when returning from Bookmarks.
  // The scroll guard stays active for a grace period after focus so that
  // spurious scroll events fired during the transition animation are also
  // blocked. The guard is cleared after the WebView has had time to
  // process the scrollToPosition message.
  useEffect(() => {
    if (Platform.OS !== "ios") return undefined;

    const unsubscribeFocus = navigation.addListener("focus", () => {
      if (!iPadScrollGuardRef.current) return;

      // A bookmark jump is in flight — it is the position the user just asked
      // for, so leave it alone.
      const isBookmarkJump = Date.now() - bookmarkJumpAtRef.current < BOOKMARK_JUMP_GRACE_MS;

      // Restore position — the WebView may have scrolled to 0 while backgrounded
      if (webViewRef.current && currentElementIdRef.current && !isBookmarkJump) {
        const scrollMessage = {
          action: "scrollToPosition",
          topInset: restoreTopInset(),
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
  }, [navigation, restoreTopInset]);

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
        readerTheme,
        isLarivaar,
        pageTopMarginRef.current
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
    readerTheme,
    isLarivaar,
  ]);

  // Called by useBookmarks immediately before the jump is posted to the WebView.
  //
  // iOS ONLY, and deliberately so. Everything below exists to stop the focus
  // listener above — which does not run on Android — from undoing the jump.
  const handleBookmarkJump = useCallback(
    (shabadID) => {
      if (Platform.OS !== "ios") return;

      const elementId = String(shabadID);
      // Paragraph mode merges several shabads into one row, so not every
      // bookmark id has an element of its own. If the WebView cannot land on it
      // there is no jump to protect and no new position to record.
      if (!shabad.some((item) => String(item.id) === elementId)) return;

      bookmarkJumpAtRef.current = Date.now();
      // The bookmark IS the new read position, so keep the saved position in
      // step — otherwise the next restore pulls the reader back to the
      // paragraph they were on before opening Bookmarks.
      currentElementIdRef.current = elementId;
      currentSequenceRef.current = null;
      dispatch(actions.setPosition(elementId, id, null));
    },
    [dispatch, id, shabad]
  );

  useBookmarks(webViewRef, shabad, bookmarkPosition, handleBookmarkJump);

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
    navigation.goBack();
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
      // Top or end of the bani: the bars come back, whatever else is going on,
      // and stay there while the page rests at that edge. Checked first, so no
      // guard below can swallow it.
      // KNOWN: that includes the iOS scroll guard, so WKWebView's spurious
      // scroll-to-0 on return from Bookmarks can post "edge" and keep the idle
      // auto-hide off until the reader scrolls. Fix planned in an upcoming
      // Reader PR.
      if (data === "edge") {
        atEdgeRef.current = true;
        clearBarsIdleTimer();
        setBarsVisible(true, "scroll_edge");
        return;
      }

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
          // Let the position-restore progress fill through — it reflects an
          // intentional scrollIntoView after load, not a spurious transition
          // scroll-to-0, so the bar must still track the restored position.
          (data.startsWith("scroll-progress-") && !data.startsWith("scroll-progress-restore-"))
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
        // Capture element ID (and optional sequence) from WebView scroll events.
        // Only update refs here — do NOT dispatch to Redux on every scroll tick.
        // saveScrollPosition() reads these refs and dispatches once on blur,
        // back, unmount or backgrounding.
        // KNOWN: a foreground crash or OOM kill skips all four, so that
        // session's position is lost. `dev` saved on every tick. A debounced
        // periodic save is planned in an upcoming Reader PR.
        const payload = data.split("scroll-elementId-")[1];
        const [elementId, seqPart] = payload.split("|seq-");
        const sequence = seqPart || null;
        currentElementIdRef.current = elementId;
        currentSequenceRef.current = sequence;
        if (shouldNavigateBack) {
          navigation.goBack();
          setShouldNavigateBack(false);
        }
      } else if (data.includes("sequenceString-")) {
        const sequenceStringData = data.split("-")[1];
        dispatch(actions.setBookmarkSequenceString(sequenceStringData));
      } else if (data.startsWith("scroll-progress-restore-")) {
        // Visual-only: fill the bar to the restored scroll position WITHOUT
        // touching scrollPercentRef. Restoring a prior position must never count
        // as reading. (Checked before the generic scroll-progress- branch below,
        // whose prefix this also matches.)
        const pct = parseFloat(data.split("scroll-progress-restore-")[1]);
        if (Number.isFinite(pct)) {
          scrollProgressAnim.setValue(pct);
        }
      } else if (data.startsWith("scroll-progress-")) {
        const pct = parseFloat(data.split("scroll-progress-")[1]);
        if (Number.isFinite(pct)) {
          scrollProgressAnim.setValue(pct);
          scrollPercentRef.current = Math.round(pct * 100);
          // Leaving the edge hands the bars back to the idle auto-hide.
          if (pct > 0 && pct < 1) atEdgeRef.current = false;
        }
      }
    },
    [
      dispatch,
      navigation,
      shouldNavigateBack,
      scheduleBarsIdleHide,
      setBarsVisible,
      clearBarsIdleTimer,
    ]
  );

  const handleLoadStart = useCallback(() => {
    setTimeout(() => {
      toggleViewLoaded(true);
    }, 100);
  }, []);

  const handleLoadEnd = useCallback(() => {
    // The bottom inset first, so the restore below measures the page at its
    // full height. Waiting for webViewLoadTick (500ms on) left a position near
    // the end landing short, with its last lines under the nav.
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ action: "setBottomInset", value: navChromeHeight })
      );
    }
    // Scroll to saved element ID after WebView is fully loaded
    if (webViewRef.current && currentElementIdRef.current) {
      const scrollMessage = {
        action: "scrollToPosition",
        topInset: restoreTopInset(),
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
  }, [navChromeHeight, restoreTopInset]);

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
    <SafeArea backgroundColor={readerBgColor} edges={["left", "right"]}>
      <StatusBarComponent backgroundColor={readerBgColor} />
      <Header
        title={titleText}
        handleBackPress={handleBackPress}
        handleBookmarkPress={handleBookmarkPress}
        isHeader={isHeader}
      />
      {(isLoading || webViewAvailable === null) && (
        <ActivityIndicator size="small" color={theme.c.primary} />
      )}
      {webViewAvailable === false && <WebViewUnavailable onRetry={recheckWebView} />}
      {webViewAvailable === true && (
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
          backgroundColor={readerBgColor}
          style={[
            webView,
            readerTheme.base === "dark" && { opacity: viewLoaded ? 1 : 0.1 },
            { backgroundColor: readerBgColor, marginTop: webViewTop },
          ]}
          onMessage={handleMessage}
        />
      )}
      {isAudioFeatureOn && isAudio && (
        <Animated.View
          style={{ transform: [{ translateY: audioLiftAnim }] }}
          // Touching the audio controls (seek, play/pause, tracks) counts as
          // activity — restart the idle countdown so the bars, and with them the
          // lifted player, don't drop away mid-interaction.
          onTouchStart={scheduleBarsIdleHide}
          onTouchMove={scheduleBarsIdleHide}
        >
          <AudioPlayer
            baniID={id}
            title={playerTitle}
            notificationTitle={titleUni || playerTitle}
            webViewRef={webViewRef}
          />
        </Animated.View>
      )}
      {isAutoScroll && (
        <View
          style={[
            styles.autoScrollFixedView,
            {
              bottom: styles.autoScrollFixedView.bottom + bottomNavInset(insetBottom),
              display: isHeader ? "flex" : "none",
            },
          ]}
        >
          <AutoScrollComponent
            shabadID={id}
            webViewRef={webViewRef}
            webViewLoadTick={webViewLoadTick}
            onActivity={scheduleBarsIdleHide}
          />
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
        style={[
          styles.scrollProgressBar,
          { backgroundColor: readerTheme.chrome.progressTrack },
          { transform: [{ translateY: progressLiftAnim }] },
        ]}
      >
        <Animated.View
          style={[
            styles.scrollProgressFill,
            { backgroundColor: readerTheme.chrome.progressFill },
            {
              width: scrollProgressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
                extrapolate: "clamp",
              }),
            },
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
