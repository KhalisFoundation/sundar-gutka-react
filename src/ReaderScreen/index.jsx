import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { AppState, Platform, View, Animated, NativeModules } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useDispatch, useSelector } from "react-redux";
import { bottomNavInset } from "@theme/components";
import { useReaderTheme } from "@theme/reader";
import PropTypes from "prop-types";
import { Spinner } from "@common/components/ui";
import WebViewUnavailable from "@common/components/WebViewUnavailable";
import { foldableTopSpace, useFoldableInsetTop } from "@common/deviceForm";
import useReadingSession from "@common/hooks/useReadingSession";
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
import AddToPothiSheet from "../Pothi/components/AddToPothiSheet";
import { Header, AutoScrollComponent, AudioPlayer, ReaderScrollbar } from "./components";
import { useBookmarks, useFetchShabad } from "./hooks";
import createStyles from "./styles";
import { loadHTML } from "./utils";
import { barMotion } from "./utils/barMotion";
import { readerTopLayout } from "./utils/topLayout";

// How long the bars linger with no interaction before auto-hiding during
// auto-scroll or audio playback.
const BARS_IDLE_HIDE_MS = 4000;

// Window after a bookmark jump during which the iOS focus-restore below stands
// down, so it cannot scroll the reader back to where it was before Bookmarks
// was opened.
const BOOKMARK_JUMP_GRACE_MS = 1500;

// How long after a touch on the audio player the page report of that same
// touch is not allowed to move the chrome.
//
// The WebView is a full-screen native view UNDER the player, running its own
// touch detection that knows nothing about React Native, so a press on the
// player is seen TWICE: once by the player, and once by the page, which cannot
// tell the finger landed on something else and reports it as a tap on the bani.
//
// That echo is why pressing play revealed the header and pausing did not: pause
// also calls onHideBars(), which lands after the echo and wins, while play has
// nothing to push back with. Pause was never in control, it just had a
// counterweight — which is why it only worked when it happened to land last.
//
// onPlayerTouch fires only for touches that land on the player, so a report
// inside this window belongs to the same finger. It is the length of a press.
const PLAYER_TOUCH_ECHO_MS = 500;

// React Native's own global. Read once here, so the dangling-underscore rule —
// which exists to stop US inventing such names — is waived in one place rather
// than at the JSX attribute, where a comment cannot go.
// eslint-disable-next-line no-underscore-dangle
const isDevBuild = Boolean(global.__DEV__);

const Reader = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  // How far the floating header covers the page.
  //
  // The header is absolutely positioned so it can slide away, which means the
  // top of the WebView viewport sits BEHIND it. A restore that scrolls an
  // element to "top of viewport" therefore parks that line under the header,
  // and the only way to read it is to scroll back up — which is what made a
  // freshly opened bani look like it had opened part-scrolled. Restores offset
  // by this instead.
  //
  // Built from the same two tokens as the header itself, so they cannot drift.
  //
  // A foldable's header gives back whatever of the fixed clearance its cutout
  // does not need (the inset is null everywhere else) — see deviceForm.js.
  const foldableInsetTop = useFoldableInsetTop();
  const headerTopClearance =
    foldableInsetTop === null
      ? theme.layout.header.topClearance
      : foldableTopSpace(foldableInsetTop, theme.layout.header.topClearance);
  const headerOverlayHeight = headerTopClearance + theme.layout.header.minHeight;
  // The reading theme styles the Bani surface. `theme` above stays the app
  // appearance and still drives everything outside this screen.
  //
  // Its light/dark records take this ground from `c.backgroundAlt` — the same
  // role the Reader header and the rest of the app sit on — so following the app
  // keeps the Reader matching every other screen, exactly as before. `readerBg`
  // is the one value that feeds SafeArea, the status bar and the WebView, which
  // is why threading the theme through here reaches all three.
  const { theme: readerTheme } = useReaderTheme();
  const isReaderDark = readerTheme.base === "dark";
  const readerBgColor = readerTheme.background.color;
  const bookmarkPosition = useSelector((state) => state.bookmarkPosition);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
  const isAudio = useSelector((state) => state.isAudio);
  const isAudioFeatureEnabled = useSelector((state) => state.isAudioFeatureEnabled);
  const isAudioFeatureOn = isAudioFeatureEnabled ?? true;
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const fontSize = useSelector((state) => state.fontSize);
  const baniFontFace = useSelector((state) => state.baniFontFace);
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
  const isPlayerDragging = useSelector((state) => state.isPlayerDragging);

  const webViewRef = useRef(null);
  const { webView } = styles;
  const { title, id, titleUni } = route.params.params || {};
  // A bani OPENS with the header and the bottom navigation in place.
  //
  // A bani is reached from the home list, the Dashboard, a pothi, a search
  // result and a notification, and arriving with the chrome already gone left
  // no visible way back from any of them — the way out had to be discovered by
  // tapping the page. It is still a reading screen: a scroll down puts the bars
  // away, a scroll up or a tap brings them back, and auto-scroll and audio
  // still hide them once the screen has been left alone.
  //
  // The transform values below sit at their SHOWN positions on mount to match,
  // so this is where the screen settles rather than somewhere it animates to —
  // the bars do not slide in for a frame after the page has drawn.
  const [isHeader, toggleHeader] = useState(true);
  // Chrome up, the bar sits on the app's navy nav; chrome away, it sits on the
  // bani page, whose lightness is the reading theme's, not the app's. The Reader
  // slides the cluster off rather than unmounting it, so `isHeader` is what says
  // which of the two is actually down there.
  useNavBarSurface(isHeader ? false : !isReaderDark);
  const [viewLoaded, toggleViewLoaded] = useState(false);
  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);
  const [dateKey, setDateKey] = useState(Date.now().toString());
  // Counter that increments on every WebView load — passed to AutoScrollComponent
  // so it can re-send the scroll command after a WKWebView remount (iOS drops
  // postMessages sent to a stale WebView instance).
  const [webViewLoadTick, setWebViewLoadTick] = useState(0);
  const [titleText, setTitleText] = useState(null);
  // Whether the add-to-pothi sheet is up. Signed out it never opens — see
  // handleAddToPothiPress.
  const [filing, setFiling] = useState(false);
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
  const { webViewTop, pageTopMargin } = readerTopLayout({
    foldableInsetTop,
    headerTopClearance: theme.layout.header.topClearance,
  });
  // The margin the HTML is built with, read through a ref so that a change to
  // it alone does not rebuild the page — see the setTopMargin effect below.
  const pageTopMarginRef = useRef(pageTopMargin);
  pageTopMarginRef.current = pageTopMargin;

  // Bottom-nav overlay footprint (nav height + the 5px progress track on top,
  // plus the bottom safe-area inset). The audio player is lifted by exactly
  // this much when the bars show so it clears the nav.
  //
  // The inset is part of the footprint because `BottomNavigation` pads it, so
  // the bar on screen is that much taller than its own height token whenever the
  // system navigation bar is drawn. Reading the token alone was correct only
  // while the app hid that bar and the inset was always zero; with the bar left
  // visible it under-measured the nav by the inset, which put the audio player
  // over the top of it and left the last line of bani behind it.
  //
  // `bottomNavInset` rather than the raw inset: on iOS the bar pads only up to
  // its cap, so adding all 34pt here would lift this chrome off the bar's top
  // edge by the 14 the cap trimmed. On Android the helper returns the inset
  // unchanged, so this is the same arithmetic it has always done.
  const navChromeHeight =
    theme.components.bottomNavigation.height + 5 + bottomNavInset(insetBottom);

  // Native-driver transforms (NOT a JS height animation) so toggling the bars
  // never resizes the flex WebView underneath — the reflow was the low-end-
  // Android jank source. navSlideAnim slides the nav overlay off-screen;
  // audioLiftAnim rides the audio player above the nav; progressLiftAnim lifts
  // the progress bar to sit on top of the nav when the bars are shown.
  //
  // Note what "down" means for the two lifted layers. Both are pinned at
  // `bottom: 0`, which is the bottom of the WINDOW, and the window is laid out
  // edge-to-edge — so 0 puts them UNDER the system navigation bar. That was
  // invisible while the app hid that bar, and it is why the progress track and
  // the audio player disappeared behind the three buttons the moment the app's
  // own bars auto-hid. They rest above it instead; the shown position stacks the
  // app's nav on top of that, which is what `navChromeHeight` already includes.
  const navSlideAnim = useRef(new Animated.Value(0)).current; // starts shown
  const navClusterHeightRef = useRef(0);
  // How far the two rest above the window bottom once the app's own bars are
  // hidden — the same clearance the bottom nav pads, and deliberately so: with
  // the bars up the track sits on the nav bar, and dropping to the line where
  // that bar's own bottom padding ends is what makes the two states look like
  // one bar moving rather than two positions.
  //
  // Android is unchanged: the whole navigation-bar inset, so neither layer lands
  // under the system buttons. iOS is capped, because there the inset is the home
  // indicator — an overlay, not an obstruction — and resting the full 34pt up
  // left a band of blank page below the progress track.
  const chromeRestLift = bottomNavInset(insetBottom);
  // Seeded where the bars being UP puts them, since that is how a bani opens:
  // the audio player clearing the nav, and the progress track sitting on it.
  // Seeding them at the resting lift instead would drop both to the page bottom
  // for a frame and then jump.
  const audioLiftAnim = useRef(new Animated.Value(-navChromeHeight)).current;
  const progressLiftAnim = useRef(new Animated.Value(-(navChromeHeight - 5))).current;

  // A layout effect, so the animation is handed to the native driver in the
  // same commit that flips `isHeader`. A plain effect runs after React lets the
  // frame paint, which held every show and hide back by that much.
  useLayoutEffect(() => {
    const distance = navClusterHeightRef.current || 300;
    const motion = barMotion(isHeader);
    const anim = Animated.parallel([
      Animated.timing(navSlideAnim, {
        toValue: isHeader ? 0 : distance,
        ...motion,
        useNativeDriver: true,
      }),
      Animated.timing(audioLiftAnim, {
        toValue: isHeader ? -navChromeHeight : -chromeRestLift,
        ...motion,
        useNativeDriver: true,
      }),
      Animated.timing(progressLiftAnim, {
        // Lift the progress bar onto the nav (nav height = navChromeHeight − 5px
        // track) when shown; drop it back to the bottom when they hide.
        toValue: isHeader ? -(navChromeHeight - 5) : -chromeRestLift,
        ...motion,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    // Stop the native-driven animation when the screen unmounts (or isHeader
    // toggles) mid-flight. Left running, the native driver keeps updating props
    // on nodes whose backing Animated.Values may be dropped during teardown,
    // which crashes in PropsAnimatedNode.updateView with "Mapped property node
    // does not exist" (RN #12893 / #37267). Stopping first also prevents the old
    // and new animations overlapping on the same values across isHeader toggles.
    return () => anim.stop();
  }, [isHeader, navSlideAnim, audioLiftAnim, progressLiftAnim, navChromeHeight, chromeRestLift]);

  // ── Bar-visibility funnel + idle auto-hide ──────────────────────────────
  // Live state mirrored into refs so the stable (empty-dep) scheduler never
  // reads stale closures.
  const isHeaderRef = useRef(isHeader);
  const isAutoScrollRef = useRef(isAutoScroll);
  const isAudioActiveRef = useRef(isAudioFeatureOn && isAudio);
  const barsIdleTimerRef = useRef(null);
  // True while the page rests at the very top or end of the bani, where the
  // bars stay up (see the "edge" message) and the idle auto-hide stands down.
  const atEdgeRef = useRef(false);

  useEffect(() => {
    isAutoScrollRef.current = isAutoScroll;
  }, [isAutoScroll]);
  useEffect(() => {
    isAudioActiveRef.current = isAudioFeatureOn && isAudio;
  }, [isAudioFeatureOn, isAudio]);

  // When the audio player last took a touch. See PLAYER_TOUCH_ECHO_MS.
  const playerTouchAtRef = useRef(0);
  const notePlayerTouch = useCallback(() => {
    playerTouchAtRef.current = Date.now();
  }, []);
  /** Whether a page message arriving now echoes a touch on the player. */
  const isPlayerEcho = useCallback(
    () => Date.now() - playerTouchAtRef.current < PLAYER_TOUCH_ECHO_MS,
    []
  );

  // Single mutation path for bar visibility — dedupes and fires analytics.
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

  // While auto-scroll or audio is active and the bars are showing, hide them
  // after a period of no interaction. Any activity (touch/scroll/control tap)
  // restarts the countdown.
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

  useEffect(() => {
    scheduleBarsIdleHide();
    return clearBarsIdleTimer;
  }, [isHeader, isAutoScroll, isAudioFeatureOn, isAudio, scheduleBarsIdleHide, clearBarsIdleTimer]);

  // Animated progress value — driven by ref to avoid re-renders on every scroll tick
  const scrollProgressAnim = useRef(new Animated.Value(0)).current;
  // Measured width of the progress bar, so the fill animates a NUMERIC pixel
  // width (0 → barWidth) instead of a percentage string. Animated percentage
  // widths can fail to apply on first paint and render full-width — this avoids
  // that entirely (the fill is 0px until measured).
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  // Fraction of the bani visible on screen (0-1], reported by the WebView on
  // layout and resize. Sizes the themed scroll indicator's thumb proportionally,
  // and hides it entirely when the whole bani already fits.
  const [visibleFraction, setVisibleFraction] = useState(1);
  // Latest scroll % (0-100) for analytics — updated on every WebView scroll message
  const scrollPercentRef = useRef(0);

  // iPad scroll guard: blocks spurious WebView scroll events during and shortly
  // after screen transitions (Bookmarks → Reader). WKWebView can fire scroll-to-0
  // events both while backgrounded AND during the return transition animation.
  const iPadScrollGuardRef = useRef(false);

  // When the last bookmark jump was posted to the WebView. Tapping a bookmark
  // dispatches the position and pops back in one go, so the focus listener
  // below fires on the same commit as the jump — without this it restores the
  // pre-Bookmarks position and undoes it. iOS only, which is why bookmarks
  // looked broken there while working on Android: the whole listener is
  // skipped on Android.
  const bookmarkJumpAtRef = useRef(0);

  // Android cannot always create a WebView (provider disabled, uninstalled or
  // mid-update); mounting one then kills the process before any boundary sees
  // it. So the page is mounted only once the probe has said yes, and the notice
  // takes its place when the answer is no.
  const { available: webViewAvailable, recheck: recheckWebView } = useWebViewAvailable();

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

  // A fresh bani starts at 0% progress. The Reader screen is REUSED across
  // banis (navigating to "Reader" swaps route.params without remounting), so
  // without this reset scrollPercentRef keeps the PREVIOUS bani's value.
  // useReadingSession reads that ref on blur to decide completion — so a stale
  // >=95% from an already-read bani would falsely auto-mark the next bani
  // "done" at 0 scroll. Reset the analytics ref and the progress bar on id change.
  useEffect(() => {
    scrollPercentRef.current = 0;
    atEdgeRef.current = false;
    scrollProgressAnim.setValue(0);
    // Back to "everything fits" until the new bani reports its own ratio, so the
    // previous bani's thumb size never briefly shows on this one.
    setVisibleFraction(1);
  }, [id, scrollProgressAnim]);

  // Bottom inset for the WebView content. Whenever the bars are visible they
  // overlay the bottom navChromeHeight strip of the viewport, hiding the last
  // few lines — in reading mode the nav bar sits there, and in audio mode the
  // player lifts up by exactly navChromeHeight over it (see audioLiftAnim). The
  // amount covered is navChromeHeight in both modes, so reserve that much
  // scrollable space at the end of the content so the last line can scroll clear.
  // Re-applied on webViewLoadTick so it survives a WebView reload. Driven by
  // message (not baked into the HTML) so it never reflows/reloads the page.
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

  // The header title, resolved the SAME way the bani list resolves its rows.
  //
  // It used to show the ASCII-mapped `gurmukhi` name whenever the bani font was
  // anything but Baloo, and for many banis that name is an abbreviation — the
  // list said "ਜਪੁਜੀ ਸਾਹਿਬ" while the Reader header said "ਜਪੁਜੀ". The Unicode
  // name is the full one, so it is preferred outright and the ASCII name is
  // converted when no Unicode name exists.
  //
  // This is header CHROME, not bani content: it renders in the header face like
  // every other screen's title rather than in the user's chosen bani font, which
  // is what made the ASCII form necessary in the first place.
  // Resolved the SAME way the bani list resolves its rows, and rendered in the
  // header face rather than the user's bani font.
  //
  // Not font-dependent. The old form fell back to the ASCII name whenever the
  // bani font was not Baloo, and the ASCII name is the abbreviated one for many
  // banis — so the header read "ਜਪੁਜੀ" where the list read "ਜਪੁਜੀ ਸਾਹਿਬ".
  //
  // The other half of this lives at the CALLERS: every screen that opens the
  // Reader must hand over a proper name. The dashboard's Continue and Explore
  // tiles used to pass the server's abbreviated `bani_title`, and because those
  // tiles only appear ONCE A BANI HAS BEEN READ, the header looked correct for
  // the first opening or two and then truncated — the later opens were coming
  // from a different screen.
  useEffect(() => {
    setTitleText(titleUni || convertToUnicode(title));
  }, [titleUni, title]);

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
          topInset: headerOverlayHeight,
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
        baniFontFace,
        isEnglishTranslation,
        isPunjabiTranslation,
        isSpanishTranslation,
        readerTheme,
        isLarivaar,
        pageTopMarginRef.current
      ),
      baseUrl: Platform.OS === "ios" ? "./" : "",
    };
    // `readerTheme` is the dependency here, not the app theme — which is what
    // makes switching a reading theme repaint the Bani immediately, with no
    // restart and no WebView remount.
  }, [
    shabad,
    isTransliteration,
    fontSize,
    baniFontFace,
    isEnglishTranslation,
    isPunjabiTranslation,
    isSpanishTranslation,
    readerTheme,
    isLarivaar,
  ]);

  // Called by useBookmarks immediately before the jump is posted to the WebView.
  //
  // iOS ONLY, and deliberately so. Everything below exists to stop the focus
  // listener above — which does not run on Android — from undoing the jump, so
  // on Android there is nothing to protect against and nothing to change. The
  // position it records would be written moments later anyway, by the WebView's
  // own `scroll-elementId-` report; leaving Android on that path keeps this fix
  // to the platform that has the bug.
  const handleBookmarkJump = useCallback(
    (shabadID) => {
      if (Platform.OS !== "ios") return;

      const elementId = String(shabadID);
      // Paragraph mode merges several shabads into one row, so not every
      // bookmark id has an element of its own. If the WebView cannot land on it
      // there is no jump to protect and no new position to record.
      if (!shabad.some((item) => String(item.id) === elementId)) return;

      bookmarkJumpAtRef.current = Date.now();
      // The bookmark IS the new read position. Element ids in the rendered HTML
      // are these same item ids (see utils/index.js), so keep the saved
      // position in step — otherwise the next restore (backgrounding, a WebView
      // reload, the next focus) pulls the reader back to the paragraph they
      // were on before opening Bookmarks.
      currentElementIdRef.current = elementId;
      currentSequenceRef.current = null;
      dispatch(actions.setPosition(elementId, id, null));
    },
    [dispatch, id, shabad]
  );

  useBookmarks(webViewRef, shabad, bookmarkPosition, handleBookmarkJump);
  useReadingSession({ baniId: id, baniTitle: titleUni || title, navigation, scrollPercentRef });

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
    saveScrollPosition();
    pauseAudioPlayback();
    navigation.goBack();
    return true;
  }, [saveScrollPosition, navigation, pauseAudioPlayback]);

  useBackHandler(handleBackPress);

  const handleBookmarkPress = useCallback(() => {
    navigation.navigate(constant.BOOKMARKS, { id });
  }, [navigation, id]);

  // Open signed out: the pothi the shabad is filed into lives on the device
  // until there is an account to carry it. See usePothiSync.
  const handleAddToPothiPress = useCallback(() => setFiling(true), []);

  // The bani being read, in the shape the pothi model stores. `id` is coerced
  // because a route param can arrive as a string and every stored `baaniId` is
  // a number — a string would never match one and the sheet would show a bani
  // it already holds as unticked.
  const filingBani = useMemo(
    () => ({ id: Number(id), gurmukhi: title, gurmukhiUni: titleUni }),
    [id, title, titleUni]
  );

  const handleMessage = useCallback(
    (message) => {
      const { data } = message.nativeEvent;
      // Top or end of the bani: the bars come back, whatever else is going on,
      // and stay there while the page rests at that edge. Checked first, so no
      // guard below can swallow it.
      //
      // The page decides what the end is — where it can scroll no further, with
      // the blank bottom inset in view — not the progress percentage. That
      // reaches 100% while the last lines are still where the returning nav bar
      // lands, so bringing the bars back on it covered them.
      if (data === "edge") {
        atEdgeRef.current = true;
        clearBarsIdleTimer();
        setBarsVisible(true, "scroll_edge");
        return;
      }
      if (isPlayerDragging) {
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

      // Handle UI messages. gutkaScript posts: "toggle" on a genuine tap,
      // "show"/"hide" on scroll up/down, and "activity" on any touch (to restart
      // the idle auto-hide countdown during auto-scroll/audio). setBarsVisible is
      // the single mutation path (dedupes + fires analytics).
      // A press on the audio player reaches BOTH the player and the page, and
      // the page reports it as a tap on the bani. Only the CHROME half of that
      // report is dropped: the floating player still grows on it, so the
      // transitions between the three player forms are exactly as they were.
      // Playing or pausing simply stops revealing the header and bottom bar.
      if (data === "toggle") {
        if (!isPlayerEcho()) {
          setBarsVisible(!isHeaderRef.current, "tap");
          scheduleBarsIdleHide();
        }
        dispatch(actions.bumpReaderTap());
      } else if (data === "activity") {
        scheduleBarsIdleHide();
      } else if (data === "show") {
        // Same rule for a scroll the player caused: starting playback with sync
        // scroll on scrolls the page, and an upward jump reads as a scroll up.
        if (isPlayerEcho()) return;
        setBarsVisible(true, "scroll_up");
        scheduleBarsIdleHide();
      } else if (data === "hide") {
        setBarsVisible(false, "scroll_down");
        // A scroll down also shrinks the floating audio player to its circle.
        // Its own counter rather than the player watching the bars go down: a
        // TAP hides those too, and a tap is supposed to GROW the player, so bar
        // visibility cannot tell the two gestures apart. See MinimizePlayer.
        dispatch(actions.bumpReaderScrollDown());
      } else if (data.includes("scroll-elementId-")) {
        // Capture element ID (and optional sequence) from WebView scroll events.
        // Only update refs here — do NOT dispatch to Redux on every scroll tick.
        // saveScrollPosition() reads these refs and dispatches once on blur/unmount.
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
        // as reading toward completion — scrollPercentRef resets to 0 on open and
        // catches up once the user actually scrolls. (Must be checked before the
        // generic scroll-progress- branch below, whose prefix this also matches.)
        const pct = parseFloat(data.split("scroll-progress-restore-")[1]);
        if (Number.isFinite(pct)) {
          Animated.timing(scrollProgressAnim, {
            toValue: pct,
            duration: 0,
            useNativeDriver: false,
          }).start();
        }
      } else if (data.startsWith("scroll-progress-")) {
        const pct = parseFloat(data.split("scroll-progress-")[1]);
        if (Number.isFinite(pct)) {
          // width isn't transform-drivable, so this can't use the native driver —
          // fine here since it's an instant (duration: 0) set, not a tween.
          Animated.timing(scrollProgressAnim, {
            toValue: pct,
            duration: 0,
            useNativeDriver: false,
          }).start();
          scrollPercentRef.current = Math.round(pct * 100);
          // Leaving the edge hands the bars back to the idle auto-hide.
          if (pct > 0 && pct < 1) atEdgeRef.current = false;
        }
      } else if (data.startsWith("scroll-ratio-")) {
        // What fraction of the bani fits on screen. Sizes the themed scroll
        // indicator's thumb and nothing else. Sent on layout and resize only,
        // never per scroll.
        const visible = parseFloat(data.split("scroll-ratio-")[1]);
        if (Number.isFinite(visible) && visible > 0) setVisibleFraction(visible);
      }
    },
    [
      dispatch,
      id,
      navigation,
      shouldNavigateBack,
      isPlayerDragging,
      setBarsVisible,
      scheduleBarsIdleHide,
      clearBarsIdleTimer,
      isPlayerEcho,
    ]
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
        topInset: headerOverlayHeight,
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
    <SafeArea backgroundColor={readerBgColor} edges={["left", "right"]}>
      <StatusBarComponent backgroundColor={readerBgColor} />
      <Header
        title={titleText}
        handleBackPress={handleBackPress}
        handleBookmarkPress={handleBookmarkPress}
        handleAddToPothiPress={handleAddToPothiPress}
        isHeader={isHeader}
      />
      {/* The same sheet the Folders tab opens, so filing a bani from the reader
          and filing one from a list are the one flow — including the "New
          Pothi" row that creates a pothi and drops this bani straight into it,
          without leaving the bani being read. */}
      <AddToPothiSheet visible={filing} onClose={() => setFiling(false)} bani={filingBani} />
      {isLoading && <Spinner size="small" color={theme.c.primary} />}
      {/* Don't mount the WebView until the shabad has loaded. Mounting on the
          initial empty shabad ([]) renders a placeholder page whose height equals
          the viewport, which the "not scrollable" check misreads as a completed
          read (false 100%) before the real content replaces it. Waiting also
          removes the wasteful empty→full WebView reload on every bani open. */}
      {webViewAvailable === false && <WebViewUnavailable onRetry={recheckWebView} />}
      {shabad.length > 0 && webViewAvailable && (
        <WebView
          key={webViewKey}
          webviewDebuggingEnabled={isDevBuild}
          javaScriptEnabled
          originWhitelist={["*"]}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          ref={webViewRef}
          onError={handleError}
          onHttpError={handleHttpError}
          decelerationRate={0.998}
          scrollEnabled={!isPlayerDragging}
          bounces={false}
          overScrollMode="never"
          nestedScrollEnabled
          // Neither platform can give a THEMED scrollbar here:
          //   • Android draws the root scroller's bar itself, from a static app
          //     resource (colors.xml -> scrollbar_thumb), and never consults
          //     ::-webkit-scrollbar (crbug 40226034).
          //   • iOS offers only default/black/white on the UIScrollView
          //     indicator, and dropped custom CSS scrollbars in iOS 14.
          // So the native indicator is off on both and <ReaderScrollbar/> draws a
          // themed one over the top. An earlier attempt turned the native bar off
          // on Android expecting the CSS to take over — it does not, which left
          // no scrollbar at all.
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          onContentProcessDidTerminate={reloadWebView}
          // Android equivalent of onContentProcessDidTerminate above: when the
          // Chromium renderer process dies out-of-process, react-native-webview
          // returns true so Android doesn't kill our app — but the WebView is
          // dead and would otherwise sit blank. Reload it the same way an iOS
          // content-process death is already handled. (Cannot catch the
          // in-process/low-memory SIGBUS case — that tears down the whole
          // process before any JS handler can run.)
          onRenderProcessGone={reloadWebView}
          source={webViewSource}
          backgroundColor={readerBgColor}
          style={[
            webView,
            // Gated on the READING theme's base, not the app's: a dark reading
            // theme needs the same first-paint fade even in a light app.
            isReaderDark && { opacity: viewLoaded ? 1 : 0.1 },
            { backgroundColor: readerBgColor, marginTop: webViewTop },
          ]}
          onMessage={handleMessage}
        />
      )}
      {/* Themed scroll indicator. Drawn here rather than styled in CSS because
          neither platform lets a reading theme tint the real scrollbar — see the
          component for the detail. Rides scrollProgressAnim, the same signal the
          bottom progress bar already uses. */}
      {shabad.length > 0 && (
        <ReaderScrollbar
          progress={scrollProgressAnim}
          color={readerTheme.scrollbar.thumb}
          width={readerTheme.scrollbar.width}
          visibleFraction={visibleFraction}
          topInset={webViewTop}
          bottomInset={insetBottom + 10}
        />
      )}
      {isAudioFeatureOn && isAudio && (
        <Animated.View
          style={{ transform: [{ translateY: audioLiftAnim }] }}
          // Touching the audio controls counts as activity — restart the idle
          // countdown so the bars (and the lifted player) don't drop mid-interaction.
          onTouchStart={scheduleBarsIdleHide}
          onTouchMove={scheduleBarsIdleHide}
        >
          <AudioPlayer
            baniID={id}
            title={titleText}
            notificationTitle={titleUni || titleText}
            webViewRef={webViewRef}
            isNavBarVisible={isHeader}
            // How far this whole wrapper DROPS when the bars hide: the lift
            // goes from -navChromeHeight to -chromeRestLift. The floating pill
            // rides inside it, so its drag floor has to reserve this or a pill
            // parked at the bottom while the bars are up leaves the screen with
            // them. See MinimizePlayer's release clamp.
            barsDrop={navChromeHeight - chromeRestLift}
            // Opening the full player from the circle must not bring the bars
            // back with it — the user asked for the controls, not the chrome.
            onHideBars={() => setBarsVisible(false, "player_expanded")}
            // Closing it gives them back: the player was what hid them.
            onShowBars={() => setBarsVisible(true, "player_closed")}
            // Any touch anywhere in the player, in any of its forms.
            onPlayerTouch={notePlayerTouch}
          />
        </Animated.View>
      )}
      {isAutoScroll && (
        <View
          testID="auto-scroll-bar-wrapper"
          // Hidden by opacity, NOT display:none. The speed slider measures its
          // track width from its own layout, and display:none lays it out at
          // zero width — which the slider stores as the track length. On the
          // next show it drew the thumb at the far left, read as 0%, and snapped
          // to the real speed a layout pass later, on every tap that brought
          // the chrome back. Keeping the box laid out keeps its width.
          //
          // Invisible has to mean untouchable and unannounced as well, so the
          // touch and accessibility props go with it.
          pointerEvents={isHeader ? "auto" : "none"}
          accessibilityElementsHidden={!isHeader}
          importantForAccessibility={isHeader ? "auto" : "no-hide-descendants"}
          style={[
            styles.autoScrollFixedView,
            {
              // Sits on top of the nav, so it clears exactly what the nav pads
              // — capped on iOS, the whole inset on Android.
              bottom: styles.autoScrollFixedView.bottom + bottomNavInset(insetBottom),
              opacity: isHeader ? 1 : 0,
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

      {/* Bottom nav overlay — pinned to the bottom, slid out via a single
          native-driver transform, so showing/hiding never resizes the WebView. */}
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0) {
            navClusterHeightRef.current = h;
            // Snap to the exact off-screen distance on first measure so the
            // initial hidden state lands precisely with no visible flash.
            if (!isHeader) navSlideAnim.setValue(h);
          }
        }}
        style={[styles.bottomChrome, { transform: [{ translateY: navSlideAnim }] }]}
      >
        <BottomNavigation
          activeKey={isAudioFeatureOn && isAudio ? "Music" : "Read"}
          context="reader"
          visible
        />
      </Animated.View>

      {/* Reading-progress bar — a separate bottom-pinned layer that never hides.
          pointerEvents none so the thin bar never intercepts taps meant for the
          nav/mini-player beneath it. */}
      <Animated.View
        pointerEvents="none"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && w !== progressBarWidth) setProgressBarWidth(w);
        }}
        style={[
          styles.scrollProgressBar,
          // Sits on the bottom edge of the Bani surface, so it takes the reading
          // theme's tint rather than the app's. Following the app resolves both
          // steps back to withAlpha(c.accent, …) — what the stylesheet sets.
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
                outputRange: [0, progressBarWidth],
                extrapolate: "clamp",
              }),
            },
          ]}
        />
      </Animated.View>
      {/* Ground behind the system navigation bar.
          
          Every other screen paints this by putting "bottom" in its root
          SafeArea's edges, which pads the inset and fills it with the screen's
          own background. The Reader cannot: its chrome — the nav overlay, the
          progress track, the audio player — is absolutely positioned against
          `bottom: 0`, which resolves to the SafeArea's PADDING box, so the pad
          would shift all three down a second time on top of the lifts they
          already carry.
          
          A plain strip does the same job without touching the layout. It takes
          the reading theme's ground, so the bar reads as the bottom of the page
          rather than a gap in it, and it sits under the chrome (zIndex 10) so
          the app's own nav still covers it when the bars are shown.

          It is `chromeRestLift` tall, not `insetBottom`: the strip is OPAQUE and
          covers the bottom of the WebView, so every point of it above where the
          progress track rests is a band of flat ground hiding the last line of
          bani. On Android the two are the same number and this is the strip it
          has always drawn. On iOS the track now rests at the capped lift, and
          the full-inset strip left 24pt of blank page above it — the gap between
          the text and the bar. Ending at the track keeps the page running right
          up to it, with ground below it exactly as before. */}
      {chromeRestLift > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: chromeRestLift,
            backgroundColor: readerBgColor,
            zIndex: 5,
          }}
        />
      )}
    </SafeArea>
  );
};

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default React.memo(Reader);
