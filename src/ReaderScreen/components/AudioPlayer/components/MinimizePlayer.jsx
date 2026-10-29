import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { View, Pressable, Animated, PanResponder, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { setPlayerDragging } from "@common/actions";
import { PlayIcon, PauseIcon } from "@common/icons";
import { CustomText, trackPlayerForm } from "@common";
import { minimizePlayerStyles } from "../style";
import { useAudioTheme, useAudioThemedStyles } from "../useAudioTheme";

// How long the pill waits, untouched, before shrinking back to its circle.
const COLLAPSE_DELAY_MS = 5000;
// Reference width the pill's original fixed-px dimensions (44 height, 28
// circle, 20 right margin, etc.) were tuned against. Every pill dimension
// below scales off the CURRENT device's width relative to this baseline,
// clamped so a small phone never shrinks the touch target below usable and a
// tablet never blows the floating pill up to a comical size.
const BASE_WIDTH = 380;
const MIN_SCALE = 0.92;
const MAX_SCALE = 1.25;

const MinimizePlayer = ({
  setMinimized,
  handlePlayPause,
  isPlaying,
  progress,
  duration,
  displayName,
  opacityStyle = null,
  pointerEvents = "auto",
  isNavBarVisible = false,
  barsDrop = 0,
  onHideBars = () => {},
}) => {
  const { theme } = useAudioTheme();
  const styles = useAudioThemedStyles(minimizePlayerStyles);
  const { width: screenW, height: screenH } = useWindowDimensions();
  // `screenH` is the whole window in edge-to-edge, system bars included, so the
  // drag floor below has to subtract the bar itself — see dragBottomMargin.
  const { bottom: insetBottom, top: insetTop } = useSafeAreaInsets();
  const dispatch = useDispatch();

  // ── Responsive metrics ────────────────────────────────────────────────────
  // Every pill dimension derives from this single scale so nothing can drift
  // out of sync across devices — the previous fixed-px constants were
  // hand-summed and only ever correct for one specific screen width.
  const scale = useMemo(
    () => Math.min(MAX_SCALE, Math.max(MIN_SCALE, screenW / BASE_WIDTH)),
    [screenW]
  );
  const metrics = useMemo(() => {
    const paddingHorizontal = Math.round(theme.spacing.md * scale);
    const rightAnchor = Math.round(theme.spacing.xl_20 * scale);
    const textPaddingLeft = Math.round(7 * scale);
    const textPaddingRight = Math.round(theme.spacing.sm * scale);
    const circleSize = Math.round(28 * scale);
    // Everything in the expanded pill that is NOT the text panel: the
    // container's horizontal padding (both sides) + the progress circle +
    // the text panel's own left/right padding — derived from the same scaled
    // values used to build the pill itself, so it can never drift out of sync.
    const pillChrome = paddingHorizontal * 2 + circleSize + textPaddingLeft + textPaddingRight;
    return {
      pillHeight: Math.round(44 * scale),
      circleSize,
      strokeWidth: Math.max(2.5, Math.round(3 * scale)),
      paddingHorizontal,
      rightAnchor,
      textPaddingLeft,
      textPaddingRight,
      iconSize: Math.round(18 * scale),
      viewportMargin: Math.round(16 * scale),
      minTextWidth: Math.round(80 * scale),
      pillChrome,
      // Drag-release bounds (see onPanResponderRelease below). Percentage of
      // screen HEIGHT, not the width-based `scale` — a bottom safe strip
      // should stay proportionally similar whether the device is a short
      // phone or a tall tablet.
      dragSideMargin: Math.round(8 * scale),
      // Never less than the system navigation bar plus a finger's clearance.
      // This was a pure percentage of screen height, which happened to land
      // above a 48dp three-button bar on a typical phone and had no reason to:
      // nothing in it knew the bar existed. It could not go wrong while the app
      // hid that bar, because there was nothing under the pill to lose it
      // behind.
      dragBottomMargin: Math.max(
        Math.min(110, Math.max(64, Math.round(screenH * 0.05))),
        insetBottom + Math.round(16 * scale)
      ),
      // The ceiling for a parked player: just clear of the status bar, so it
      // can rest anywhere on the screen but never under the system chrome.
      dragTopMargin: insetTop + Math.round(16 * scale),
    };
  }, [
    scale,
    screenH,
    insetBottom,
    insetTop,
    theme.spacing.md,
    theme.spacing.xl_20,
    theme.spacing.sm,
  ]);
  // The PanResponder below is created ONCE (useRef) and must never close over
  // `metrics` directly — that would freeze the first render's values forever
  // (e.g. across an orientation change). Route through a ref, same pattern as
  // dimsRef/textWidthRef further down.
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;
  // How far this player's wrapper will drop once the Reader's bars hide, or 0
  // when they are already down. Through a ref for the same reason as `metrics`:
  // the PanResponder is built once and must not freeze the first value.
  const dropReserveRef = useRef(0);
  dropReserveRef.current = isNavBarVisible ? barsDrop : 0;
  // …and the mirror: how far it will LIFT once the bars come back, or 0 when
  // they are already up. A player parked at the ceiling with the bars down
  // would otherwise ride the wrapper's lift straight under the status bar.
  const liftReserveRef = useRef(0);
  liftReserveRef.current = isNavBarVisible ? 0 : barsDrop;

  // ── Expand / collapse ─────────────────────────────────────────────────────
  const tapTick = useSelector((state) => state.readerTapTick);
  const scrollDownTick = useSelector((state) => state.readerScrollDownTick);
  const [isExpanded, setIsExpanded] = useState(true);
  const [textWidth, setTextWidth] = useState(null);
  const collapseTimer = useRef(null);
  const tickInitRef = useRef(true);
  // Ref so the PanResponder closure (created once) always sees the latest
  // measured text width without needing to be recreated.
  const textWidthRef = useRef(null);
  // Mirror of isExpanded for the drag-release clamp (closure is created once).
  const isExpandedRef = useRef(true);

  // The ONE path between the pill and the circle. Dedupes, so a repeated cause
  // is not counted as a conversion, and records what actually caused it —
  // there is no other way to change the form, so the analytics cannot fall
  // behind the UI the way a `setIsExpanded` scattered over four effects would.
  const setForm = useCallback((expanded, trigger) => {
    if (isExpandedRef.current === expanded) return;
    isExpandedRef.current = expanded;
    setIsExpanded(expanded);
    trackPlayerForm(expanded ? "mini" : "micro", trigger);
  }, []);

  const armCollapse = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setForm(false, "idle"), COLLAPSE_DELAY_MS);
  }, [setForm]);
  // The PanResponder is created once and must not close over `armCollapse`
  // directly — same reason as metricsRef above.
  const armCollapseRef = useRef(armCollapse);
  armCollapseRef.current = armCollapse;

  // No expand/collapse animation — the pill snaps instantly between mini
  // (circle + text) and micro (circle only). This effect only (re)arms the
  // auto-collapse timer; `setForm` above is what keeps isExpandedRef in sync.
  useEffect(() => {
    if (isExpanded) {
      armCollapse();
    } else if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, [isExpanded, armCollapse]);

  // A tap anywhere in the bani WebView EXPANDS the player to the pill — it does
  // not toggle. Toggling meant a tap while already expanded collapsed it back
  // to the circle, so reaching the pill from the circle was a coin flip
  // depending on what state it happened to be in. Collapsing is the idle
  // timer's and the scroll's job, not the tap's.
  useEffect(() => {
    if (tickInitRef.current) {
      tickInitRef.current = false;
      return;
    }
    setForm(true, "reader_tap");
  }, [tapTick, setForm]);

  // Scrolling DOWN shrinks the pill to its circle, so reading is never done
  // around a floating name plate. It arrives the same way the tap above does:
  // the WebView posts on scroll, the Reader bumps a counter, and the change of
  // counter is the event.
  //
  // A counter of its own rather than watching the bars go down, even though a
  // scroll down hides those too: a TAP also hides them, and a tap is supposed
  // to grow this player, not shrink it. Watching the bars would make the two
  // gestures indistinguishable and leave the outcome to effect ordering.
  const scrollInitRef = useRef(true);
  useEffect(() => {
    if (scrollInitRef.current) {
      scrollInitRef.current = false;
      return;
    }
    setForm(false, "scroll_down");
  }, [scrollDownTick, setForm]);

  // When the nav bar + header reappear (scroll up while this circular/pill
  // player is the active mode), expand alongside them — only on the
  // hidden→visible transition, so it never re-collapses just because the bars
  // are already showing.
  const wasNavBarVisibleRef = useRef(isNavBarVisible);
  useEffect(() => {
    if (isNavBarVisible && !wasNavBarVisibleRef.current) {
      setForm(true, "scroll_up");
    }
    wasNavBarVisibleRef.current = isNavBarVisible;
  }, [isNavBarVisible, setForm]);

  useEffect(() => {
    textWidthRef.current = textWidth;
  }, [textWidth]);

  // Pausing from the circle opens the full player; resuming changes nothing but
  // the playback state.
  //
  // Pausing is the point at which someone wants the controls — to scrub, change
  // track or close — so the full player comes to them rather than making them
  // hunt for it. Resuming is the opposite: they are settling back into
  // listening, so the player must not grow, expand or move under them.
  const onPlayPausePress = () => {
    const wasPlaying = isPlaying;
    handlePlayPause();
    if (wasPlaying) {
      setMinimized(false, "pause");
      // The full player is what was asked for — NOT the nav bar and header with
      // it. Asserted rather than assumed: nothing here is supposed to raise the
      // chrome, so if anything ever does, this still holds the requirement.
      onHideBars();
    }
    // Resuming: leave the pill exactly as it is. Re-arming the collapse timer
    // here is what made it flip back to the pill form on resume.
  };

  // Tapping the pill opens the FULL player, and the bars stay down with it.
  // Reaching for the controls is not a request for the header and the bottom
  // navigation as well; they were arriving because the full player used to be
  // opened without saying anything about the chrome.
  const openFullPlayer = () => {
    setMinimized(false, "mini_tap");
    onHideBars();
  };

  // Widest the text panel may be before the expanded pill would run off-screen.
  // The pill is deliberately content-sized (so a short name doesn't leave a gap),
  // but with NO cap a long artist name simply overflowed the viewport on narrow
  // devices — the same unbounded-content bug the Seva page had. This bound only
  // bites when the name genuinely doesn't fit; on a normal phone the full name
  // still shows untruncated, and beyond it numberOfLines={1} ellipsizes.
  const maxTextWidth = Math.max(
    metrics.minTextWidth,
    screenW - metrics.viewportMargin * 2 - metrics.pillChrome
  );

  // ── CSS anchor side ───────────────────────────────────────────────────────
  // When the pill is on the LEFT half we switch the container from
  //   right: metrics.rightAnchor  (grows leftward on expand — text overflows left edge)
  // to
  //   left: leftAnchor     (grows rightward on expand — text opens toward centre)
  //
  // The anchor is switched in the spring-completion callback (pill at rest, no
  // concurrent animated-value mutation) to avoid the instability that caused
  // earlier attempts to crash.
  //
  // No-flash technique for RIGHT→LEFT: absorb the current pan offset into the
  // new leftAnchor instead of resetting pan to 0, so the visual position never
  // changes: leftAnchor = finalAbsX - lastOffset.x  →  leftAnchor + lastOffset.x = finalAbsX ✓
  //
  // For LEFT→RIGHT we must call pan.x.setValue to resync; React Native batches
  // that update with the setState so it resolves in the same frame.
  const [isOnLeft, setIsOnLeft] = useState(false);
  const [leftAnchor, setLeftAnchor] = useState(0);
  const isOnLeftRef = useRef(false);

  // ── Pan drag (identical to committed code — the buttery-smooth baseline) ─
  const pan = useRef(new Animated.ValueXY()).current;
  const lastOffset = useRef({ x: 0, y: 0 });
  const viewRef = useRef(null);
  const dimsRef = useRef({ w: screenW, h: screenH });
  dimsRef.current = { w: screenW, h: screenH };

  const panResponder = useRef(
    PanResponder.create({
      // Only steal the gesture once the finger actually moves, so taps still
      // reach the play/pause and expand handlers below. (Identical to the
      // committed buttery-smooth baseline — do not add onStartShouldSetPanResponder
      // here; that causes an extra re-render cycle mid-grant that breaks drag.)
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset(lastOffset.current);
        pan.setValue({ x: 0, y: 0 });
        dispatch(setPlayerDragging(true));
        // Hold the pill open for the drag, and start the idle countdown again
        // from the moment it is let go (below).
        //
        // The countdown used to be armed once, when the pill expanded, and
        // nothing restarted it — so it measured time since EXPANSION, not time
        // since the last touch, which is what the constant's own name says. A
        // drag begun four seconds in had the pill collapse under the finger: it
        // is right-anchored, so it shrank from the LEFT and jumped most of a
        // text panel's width away from where the finger was holding it. The
        // circle has no timer running, so a drag of the circle could never do
        // this — which is the whole of why the two forms felt different to
        // drag.
        if (isExpandedRef.current) armCollapseRef.current();
      },
      // Bounded WHILE the finger is down, not only once it is let go.
      //
      // This was a bare Animated.event, so the player tracked the finger
      // anywhere and only sprang back on release — it could be held under the
      // reading-progress track, and under the system navigation bar with it,
      // for as long as the drag lasted.
      //
      // The offset is set on grant and the value zeroed with it, so the live
      // position is `lastOffset + (dx, dy)` and the RESTING position is exactly
      // 0. That resting spot already clears the progress track: the Reader
      // lifts this player's whole wrapper to sit above it in both bar states
      // (see audioLiftAnim / progressLiftAnim), and the container adds its own
      // 10pt on top. So nothing below 0 is a place this may go — hence the
      // ceiling on downward travel. Upward is left free, and the release clamp
      // still holds it inside the strip.
      onPanResponderMove: (_, g) => {
        pan.x.setValue(g.dx);
        pan.y.setValue(Math.min(g.dy, -lastOffset.current.y));
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        dispatch(setPlayerDragging(false));
        if (isExpandedRef.current) armCollapseRef.current();
      },
      onPanResponderRelease: (_, g) => {
        dispatch(setPlayerDragging(false));
        if (isExpandedRef.current) armCollapseRef.current();
        // Book the CLAMPED travel, not the finger's. The move handler above
        // stops the pill at its resting spot while the finger keeps going, so
        // `g.dy` can be far below anything that was ever drawn. Recording the
        // raw value put the phantom position into `lastOffset`, and everything
        // downstream trusted it: the spring's target is built from
        // `lastOffset`, so letting go animated the pill down under the progress
        // track to a place the drag itself had refused to show — and even with
        // no spring, the next grant's `setOffset` snapped it there.
        const clampedDy = Math.min(g.dy, -lastOffset.current.y);
        lastOffset.current = {
          x: lastOffset.current.x + g.dx,
          y: lastOffset.current.y + clampedDy,
        };
        pan.flattenOffset();

        viewRef.current?.measureInWindow((x, y, w, h) => {
          const { w: sw, h: sh } = dimsRef.current;
          const { dragSideMargin: SIDE, dragBottomMargin, dragTopMargin } = metricsRef.current;
          // Reserve the drop that is COMING, not just the bar that is there.
          //
          // This player sits inside a wrapper the Reader lifts by
          // `navChromeHeight` while the bars are up and lets fall back to
          // `insetBottom` when they hide — and touching the player restarts the
          // idle countdown that hides them. So parking the pill on the floor
          // with the bars visible put it exactly `barsDrop` below that floor
          // four seconds later: under the system navigation bar, off the bottom
          // of the screen, and not coming back until the bars did. The clamp was
          // right for the instant it ran and nothing re-ran it.
          //
          // Same principle as `expandedW` below, which clamps by the pill the
          // circle will become rather than the circle it is: reserve for the
          // state this thing is about to be in.
          const BOTTOM = dragBottomMargin + dropReserveRef.current;
          // The player parks wherever it is dropped, anywhere on the screen.
          // It used to be confined to a strip above the progress track so it
          // could never sit over the bani; that is now the user's choice to
          // make. Only the system chrome stays out of bounds: the status bar
          // above, the navigation bar and progress track below — and, like the
          // floor, the ceiling reserves the wrapper's coming lift, not just the
          // chrome that is there now.
          const TOP = dragTopMargin + liftReserveRef.current;

          const newIsOnLeft = x + w / 2 < sw / 2;

          // Clamp using the EXPANDED footprint so the pill can never leave the
          // viewport on ANY edge once the user taps to expand it — even when it
          // is currently collapsed. The text adds `delta` px on the growth side:
          // right-anchored pills grow LEFT, left-anchored pills grow RIGHT, so
          // the resting box [minEdge, maxEdge] must fit within [SIDE, sw-SIDE].
          //
          // Derived from the metrics rather than branched on the CURRENT form,
          // so both forms are clamped by the same number. It used to be
          // `w + delta` while collapsed and a bare `w` while expanded: the
          // circle was therefore pulled well inside the edge, with the width of
          // a whole text panel to spare, while the pill was held to its own
          // exact width with no slack at all. Same drag, two different
          // margins — the circle always came back and the pill did not.
          const delta = textWidthRef.current ?? 140;
          const expandedW = Math.max(w, metricsRef.current.pillChrome + delta);
          const minEdge = newIsOnLeft ? x : x + w - expandedW;
          const maxEdge = newIsOnLeft ? x + expandedW : x + w;

          let dx = 0;
          let dy = 0;
          if (minEdge < SIDE) dx = SIDE - minEdge;
          else if (maxEdge > sw - SIDE) dx = sw - SIDE - maxEdge;
          if (y < TOP) dy = TOP - y;
          else if (y + h > sh - BOTTOM) dy = sh - BOTTOM - (y + h);

          // Called after the spring (or immediately when no clamping is needed)
          // so the pan value is at rest — safe to mix with setState.
          const doSideUpdate = () => {
            const finalAbsX = x + dx;

            if (newIsOnLeft && !isOnLeftRef.current) {
              // RIGHT → LEFT: absorb pan offset into the new left anchor so
              // we never call pan.setValue (zero-flash transition).
              //   leftAnchor + lastOffset.x = finalAbsX  ✓
              isOnLeftRef.current = true;
              setIsOnLeft(true);
              setLeftAnchor(finalAbsX - lastOffset.current.x);
            } else if (!newIsOnLeft && isOnLeftRef.current) {
              // LEFT → RIGHT: resync pan.x with the right anchor.
              //   visual = (sw - rightAnchor - w) + newPanX = finalAbsX
              const newPanX = finalAbsX - (sw - metricsRef.current.rightAnchor - w);
              pan.x.setValue(newPanX);
              lastOffset.current = { x: newPanX, y: lastOffset.current.y };
              isOnLeftRef.current = false;
              setIsOnLeft(false);
            } else if (newIsOnLeft) {
              // STAY LEFT: refresh the anchor for the new resting position.
              setLeftAnchor(finalAbsX - lastOffset.current.x);
            }
            // STAY RIGHT: no change needed.
          };

          if (dx !== 0 || dy !== 0) {
            const target = {
              x: lastOffset.current.x + dx,
              y: lastOffset.current.y + dy,
            };
            lastOffset.current = target;
            Animated.spring(pan, {
              toValue: target,
              useNativeDriver: false,
              bounciness: 4,
            }).start(doSideUpdate);
          } else {
            doSideUpdate();
          }
        });
      },
    })
  ).current;

  // ── Progress arc ──────────────────────────────────────────────────────────
  const timeToSeconds = (timeStr) => {
    if (!timeStr || typeof timeStr !== "string") return 0;
    const parts = timeStr.split(":");
    if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    if (parts.length === 1) return parseInt(parts[0], 10);
    return 0;
  };

  const durationSeconds = timeToSeconds(duration);
  const progressSeconds = timeToSeconds(progress);
  const progressValue =
    durationSeconds > 0 ? Math.min(Math.max(progressSeconds / durationSeconds, 0), 1) : 0;

  const { circleSize, strokeWidth } = metrics;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressValue * circumference;

  // ── Container anchor ──────────────────────────────────────────────────────
  // On the left side switch to a left-edge anchor so the pill grows rightward
  // (toward the screen centre) as the text panel expands. The pill background
  // and shadow always cover the full pill width in both modes.
  const anchorStyle = isOnLeft ? { right: undefined, left: leftAnchor } : null;
  // Pill geometry that scales with `metrics` — placed here (not in
  // style.js) because it must react to the current screen size, while the
  // base styles are theme-only. See the "Responsive metrics" section above.
  const responsiveContainerStyle = {
    height: metrics.pillHeight,
    borderRadius: metrics.pillHeight,
    paddingHorizontal: metrics.paddingHorizontal,
    bottom: Math.round(10 * scale),
    right: metrics.rightAnchor,
  };
  // The micro form is a CIRCLE, so its width is pinned to the pill own height
  // rather than left to fall out of padding + circle. Those are rounded
  // independently per device scale, so at some sizes they summed a pixel or two
  // wide and the "circle" came out a slightly squashed oval.
  const microStyle = isExpanded
    ? null
    : { width: metrics.pillHeight, paddingHorizontal: 0, justifyContent: "center" };

  return (
    <Animated.View
      ref={viewRef}
      pointerEvents={pointerEvents}
      style={[
        styles.container,
        responsiveContainerStyle,
        microStyle,
        anchorStyle,
        opacityStyle,
        { transform: pan.getTranslateTransform() },
      ]}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...panResponder.panHandlers}
    >
      <Pressable
        style={[styles.progressContainer, { width: circleSize, height: circleSize }]}
        onPress={onPlayPausePress}
      >
        <Svg width={circleSize} height={circleSize} style={styles.svgContainer}>
          {/* Track ring: matches bani-reads progress bar background.
              In dark mode the white-grey sits cleanly on the dark pill;
              in light mode the existing TERTIARY_COLOR (#EEE) is correct. */}
          <Circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke={theme.c.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Fill ring: primary (same as bani-reads fill) */}
          <Circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke={theme.c.textBrand}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
          />
        </Svg>
        {/* Icon color matches the full player's play/pause in both modes:
            audioTitleText = white-ish (#BED2F2) in dark, brand blue in light. */}
        <View style={styles.playPauseButton}>
          {isPlaying ? (
            <PauseIcon size={metrics.iconSize} color={theme.c.textBrand} />
          ) : (
            <PlayIcon size={metrics.iconSize} color={theme.c.textBrand} />
          )}
        </View>
      </Pressable>

      <View
        pointerEvents={isExpanded ? "auto" : "none"}
        style={[
          styles.textWrap,
          { opacity: isExpanded ? 1 : 0, maxWidth: maxTextWidth },
          // Collapse to width 0 instantly when not expanded. Before the text is
          // measured (textWidth == null) we leave width unset so it lays out at
          // its natural size for the one-time onLayout measurement.
          textWidth != null && { width: isExpanded ? textWidth : 0 },
        ]}
      >
        <Pressable
          // maxWidth is applied BEFORE the measurement below, so the width
          // onLayout reports is already viewport-safe and everything derived
          // from it (the pill width, and the drag-release clamp's `delta`)
          // stays within bounds too.
          style={[
            styles.textContainer,
            {
              maxWidth: maxTextWidth,
              paddingLeft: metrics.textPaddingLeft,
              paddingRight: metrics.textPaddingRight,
            },
            textWidth != null && { width: textWidth },
          ]}
          onPress={openFullPlayer}
          onLayout={(e) => {
            if (textWidth == null) {
              setTextWidth(e.nativeEvent.layout.width);
            }
          }}
        >
          <CustomText style={styles.timestamp} numberOfLines={1}>
            {progress}
          </CustomText>
          <CustomText style={styles.artistName} numberOfLines={1}>
            {displayName}
          </CustomText>
        </Pressable>
      </View>
    </Animated.View>
  );
};

MinimizePlayer.propTypes = {
  /** `(minimized, trigger)` — the single tracked path in and out of the full player. */
  setMinimized: PropTypes.func.isRequired,
  handlePlayPause: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  progress: PropTypes.string.isRequired,
  duration: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  isDragging: PropTypes.bool,
  opacityStyle: PropTypes.shape(),
  pointerEvents: PropTypes.string,
  isNavBarVisible: PropTypes.bool,
  /** Distance the Reader's audio wrapper falls when the bars hide. */
  barsDrop: PropTypes.number,
  /** Keeps the Reader's chrome down when pausing opens the full player. */
  onHideBars: PropTypes.func,
};

const arePropsEqual = (prevProps, nextProps) => {
  // We must re-render if dragging state, pointerEvents, opacity reference, or
  // nav-bar visibility changes (the last one drives the expand-on-reveal effect,
  // which would never see a new value if memo swallowed the re-render).
  if (
    prevProps.isDragging !== nextProps.isDragging ||
    prevProps.pointerEvents !== nextProps.pointerEvents ||
    prevProps.opacityStyle?.opacity !== nextProps.opacityStyle?.opacity ||
    prevProps.isNavBarVisible !== nextProps.isNavBarVisible ||
    prevProps.barsDrop !== nextProps.barsDrop
  ) {
    return false;
  }

  // If it is dragging, we only re-render if critical props change (ignoring 100ms progress ticks)
  if (nextProps.isDragging) {
    return (
      prevProps.isPlaying === nextProps.isPlaying &&
      prevProps.displayName === nextProps.displayName &&
      prevProps.duration === nextProps.duration
    );
  }

  return (
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.progress === nextProps.progress &&
    prevProps.duration === nextProps.duration &&
    prevProps.displayName === nextProps.displayName
  );
};

export default React.memo(MinimizePlayer, arePropsEqual);
