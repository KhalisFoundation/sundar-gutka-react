import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import ScreenRolesProvider from "@theme/ScreenRolesProvider";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";
import STRINGS from "../../localization";

// How every bottom sheet in the app moves: it slides up to open, can be dragged
// down to close the way Instagram's comment sheet can, and slides back down to
// close however it was closed — a drag, a tap outside, back, or Cancel.
//
// ── One value ──────────────────────────────────────────────────────────────
// The panel's offset below its resting place is ONE shared value, and opening,
// dragging and closing all move that same value. Closing is one animation
// whatever asked for it, so a tap outside leaves exactly as smoothly as a drag
// does. It used to be two: a drag slid the panel its own height and thinned
// the scrim with it, while every other close shot it 700px in 110ms under a
// scrim that stayed at full strength and then vanished in one frame.
//
// It runs on the UI thread (Reanimated shared values under a gesture-handler
// pan), so the panel keeps up with the finger on the low end of the supported
// range too — a JS-driven drag stutters exactly there.
//
// ── Opening ────────────────────────────────────────────────────────────────
// The scrim is there at full strength from the first frame — it is what says
// the tap landed — and the panel slides up over it.
//
// The slide starts on the Modal's `onShow`, never from an effect. A Modal is a
// separate native window whose children are not attached when the commit that
// renders it runs its effects; an animation started there targets a view that
// does not exist yet, and the sheet stays below the screen under a scrim with
// no way out but tapping it. `onShow` is React Native's documented "the modal
// is now on screen" callback — on Android it comes straight from the Dialog's
// own `setOnShowListener` (ReactModalHostManager.addEventEmitters).
//
// ── Dragging and closing ───────────────────────────────────────────────────
// The panel follows the finger 1:1 downwards and not at all upwards, and the
// scrim thins in step with how far it has travelled, so the screen behind
// reads as coming back. Let go past a distance or with a flick and the sheet
// leaves; short of both, it springs home. Leaving slides it exactly its own
// height, the scrim thinning with it, and only then does the sheet unmount.
//
// ── Where a drag may start ─────────────────────────────────────────────────
// Anywhere a downward drag cannot mean anything else:
//   • the grab zone at the top — the bar itself, the title, a fixed header;
//   • a scrolling body, but only while it sits at its very top. Scrolled down,
//     a downward drag scrolls the list back, as it always did.
// Never on a control that owns vertical movement of its own — a picker wheel,
// a reorderable list — which is why a sheet that cannot vouch for its body
// offers the grab zone alone.
//
// Activation is decided by hand (`manualActivation`) from where the touch
// started and which way it is going, so a tap never activates the pan: every
// button, row and key inside the sheet still takes its press exactly as before.
//
// ── Inside a Modal ─────────────────────────────────────────────────────────
// Every sheet is a React Native Modal, which on Android is its own window,
// outside the app's gesture-handler root — so no gesture fires there unless
// the Modal's content has a root of its own (react-native-gesture-handler,
// "Usage with modals"). `SheetGestureRoot` is that root. A root nested inside
// another enabled one switches itself off (RNGestureHandlerRootView:
// `rootViewEnabled = !hasGestureHandlerEnabledRootView(this)`), so a sheet
// whose content already carries one keeps working unchanged.

/** Travel below which a touch has not yet shown which way it is going. */
export const DRAG_SLOP = 8;
/** A release this far down closes the sheet… */
export const DISMISS_DISTANCE = 120;
/** …or this share of a short sheet's height, whichever is less. */
export const DISMISS_SHARE = 0.25;
/** A downward flick at least this fast closes it however short the drag, px/s. */
export const FLING_VELOCITY = 900;
/**
 * How far below its resting place a sheet starts when it opens. It has not
 * been measured yet, so this has to clear the tallest sheet.
 */
export const SHEET_TRAVEL = 700;
/** The slide up. */
const OPEN = { duration: 140, easing: Easing.out(Easing.cubic) };
/** The slide down, whatever closed the sheet. */
const LEAVE = { duration: 180 };
/** Home again when let go short of closing: firm, with no bounce past rest. */
const SNAP_BACK = { damping: 26, stiffness: 260, overshootClamping: true };

/**
 * Whether a touch that is on the move should drag the sheet.
 *
 * @returns {"wait"|"activate"|"fail"} wait while it has not moved far enough to
 *   tell; fail for anything but a downward drag from somewhere that allows it.
 */
export const grabDecision = ({
  dx,
  dy,
  y,
  grabUntil,
  bodyTop,
  bodyBottom,
  bodyScrolls,
  scrollY,
}) => {
  "worklet";

  if (Math.abs(dx) < DRAG_SLOP && Math.abs(dy) < DRAG_SLOP) return "wait";
  // Upwards, or more sideways than down: scrolling, a swipe, not a dismissal.
  if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) return "fail";
  if (y < grabUntil) return "activate";
  if (bodyScrolls && y >= bodyTop && y <= bodyBottom && scrollY <= 0) return "activate";
  return "fail";
};

/** Whether a released drag has gone far or fast enough to close the sheet. */
export const shouldDismiss = ({ translationY, velocityY, height }) => {
  "worklet";

  if (translationY <= 0) return false;
  const distance = Math.min(DISMISS_DISTANCE, Math.max(height, 1) * DISMISS_SHARE);
  return translationY >= distance || velocityY >= FLING_VELOCITY;
};

/**
 * A sheet's opening, dragging and closing, and the styles they drive.
 *
 * @param {object} options
 * @param {boolean} options.visible Whether the sheet should be open.
 * @param {Function} options.onClose The sheet's ordinary close — a drag that
 *   closes calls exactly what a scrim tap would.
 * @param {boolean} [options.grabEverywhere] The whole panel is a grab zone —
 *   for a sheet with nothing inside that scrolls or drags vertically.
 * @param {boolean} [options.bodyScrolls] The body reported through
 *   `onBodyLayout`/`onBodyScroll` is a scroller, so it may start a drag while
 *   at its top.
 * @returns `mounted` stays true until the sheet has left the screen, so the
 *   caller renders nothing only once it has; `onShow` MUST go to the Modal's
 *   prop of that name, or the sheet never opens.
 */
export const useSheetMotion = ({
  visible,
  onClose,
  grabEverywhere = false,
  bodyScrolls = false,
}) => {
  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(mounted);
  mountedRef.current = mounted;
  // Whether the Modal has shown. A sheet reopened while it is still leaving
  // keeps its window, so no second `onShow` comes to slide it back up.
  const shownRef = useRef(false);

  // Below the screen even when it mounts already open. Starting in place, a
  // sheet first rendered with `visible` (the reminder sheet, which renders
  // nothing until a reminder is picked) drew one frame fully up, was sent off
  // screen by the effect below, then slid back in on `onShow` — a flicker.
  const offset = useSharedValue(SHEET_TRAVEL);
  // Off while the sheet slides in, so the scrim is at full strength from the
  // first frame; on once it is up, and while it is dragged or leaves.
  const scrimFollows = useSharedValue(false);
  const height = useSharedValue(0);
  // Until something is measured, only a whole-panel sheet has a grab zone.
  const grabUntil = useSharedValue(grabEverywhere ? Number.MAX_VALUE : 0);
  const bodyTop = useSharedValue(0);
  const bodyBottom = useSharedValue(0);
  const scrolls = useSharedValue(bodyScrolls);
  const scrollY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const touchY = useSharedValue(0);

  // Held in a ref so the gesture is built once and still calls the latest
  // close — callers pass an inline arrow.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const requestClose = useCallback(() => closeRef.current?.(), []);

  const unmount = useCallback(() => {
    shownRef.current = false;
    setMounted(false);
  }, []);

  useEffect(() => {
    scrolls.value = bodyScrolls;
  }, [bodyScrolls, scrolls]);

  const slideUp = useCallback(() => {
    offset.value = withTiming(0, OPEN, (finished) => {
      if (finished) scrimFollows.value = true;
    });
  }, [offset, scrimFollows]);

  useEffect(() => {
    if (visible) {
      scrollY.value = 0;
      scrimFollows.value = false;
      if (mountedRef.current && shownRef.current) {
        slideUp();
      } else {
        // Waits below the screen for `onShow`.
        offset.value = SHEET_TRAVEL;
        setMounted(true);
      }
      return;
    }
    if (!mountedRef.current) return;
    // Its own height is exactly far enough to clear the screen.
    const distance = height.value > 0 ? height.value : SHEET_TRAVEL;
    // Already there: a drag took it off before asking to close.
    if (offset.value >= distance) {
      unmount();
      return;
    }
    scrimFollows.value = true;
    offset.value = withTiming(distance, LEAVE, (finished) => {
      if (finished) runOnJS(unmount)();
    });
    // Keyed on `visible` alone: the rest are stable references.
  }, [visible]);

  /** Starts the slide up. Hand straight to the Modal's `onShow`. */
  const onShow = useCallback(() => {
    shownRef.current = true;
    slideUp();
  }, [slideUp]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .onTouchesDown((event) => {
          const [touch] = event.allTouches;
          if (!touch) return;
          startX.value = touch.absoluteX;
          startY.value = touch.absoluteY;
          touchY.value = touch.y;
        })
        .onTouchesMove((event, manager) => {
          const [touch] = event.allTouches;
          if (!touch) return;
          const decision = grabDecision({
            dx: touch.absoluteX - startX.value,
            dy: touch.absoluteY - startY.value,
            y: touchY.value,
            grabUntil: grabUntil.value,
            bodyTop: bodyTop.value,
            bodyBottom: bodyBottom.value,
            bodyScrolls: scrolls.value,
            scrollY: scrollY.value,
          });
          if (decision === "activate") manager.activate();
          else if (decision === "fail") manager.fail();
        })
        // The keyboard is left where it is while the sheet is dragged. A sheet
        // lifts itself clear of it by its height, so dismissing it here would
        // drop the panel by that much under the finger; it goes with the sheet
        // when the sheet closes, as it does on a scrim tap.
        .onUpdate((event) => {
          scrimFollows.value = true;
          offset.value = Math.max(0, event.translationY);
        })
        .onEnd((event) => {
          const release = {
            translationY: event.translationY,
            velocityY: event.velocityY,
            height: height.value,
          };
          if (shouldDismiss(release)) {
            // Carries on off the bottom in the direction it was going — the
            // same slide every close uses — and only THEN closes, so a sheet
            // that takes itself down the moment it is closed has nothing left
            // on screen to cut off.
            offset.value = withTiming(
              height.value > 0 ? height.value : SHEET_TRAVEL,
              LEAVE,
              (finished) => {
                if (finished) runOnJS(requestClose)();
              }
            );
          } else {
            offset.value = withSpring(0, SNAP_BACK);
          }
        }),
    // Built once: shared values are stable references, and the close it calls
    // is read through a ref.
    []
  );

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  // The scrim thins as the sheet travels, back to nothing by the time the panel
  // has moved its own height.
  const scrimStyle = useAnimatedStyle(() => ({
    opacity:
      scrimFollows.value && height.value > 0
        ? interpolate(offset.value, [0, height.value], [1, 0], Extrapolation.CLAMP)
        : 1,
  }));

  const onPanelLayout = useCallback(
    (event) => {
      height.value = event.nativeEvent.layout.height;
    },
    [height]
  );

  /** The grab zone ends at the bottom of whatever reports here. */
  const onGrabZoneLayout = useCallback(
    (event) => {
      if (grabEverywhere) return;
      const { y, height: zoneHeight } = event.nativeEvent.layout;
      grabUntil.value = y + zoneHeight;
    },
    [grabEverywhere, grabUntil]
  );

  /** The body's frame. Everything above it is the grab zone. */
  const onBodyLayout = useCallback(
    (event) => {
      const { y, height: bodyHeight } = event.nativeEvent.layout;
      bodyTop.value = y;
      bodyBottom.value = y + bodyHeight;
      if (!grabEverywhere) grabUntil.value = y;
    },
    [bodyTop, bodyBottom, grabEverywhere, grabUntil]
  );

  /** The body's scroll offset, so a drag starts only from its top. */
  const onBodyScroll = useCallback(
    (y) => {
      scrollY.value = y;
    },
    [scrollY]
  );

  return {
    mounted,
    onShow,
    gesture,
    panelStyle,
    scrimStyle,
    onPanelLayout,
    onGrabZoneLayout,
    onBodyLayout,
    onBodyScroll,
  };
};

/** The bar itself; read through `SheetHandle`, which sets its palette. */
const HandleBar = ({ onClose, accessibilityLabel = undefined, onLayout = undefined }) => {
  const { c, space, layout } = useTokens();
  const { handleWidth, handleHeight } = layout.sheet;
  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? STRINGS.CLOSE}
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === "activate") onClose();
      }}
      style={{
        alignItems: "center",
        paddingTop: space.xs,
        paddingBottom: space.sm,
      }}
    >
      <View
        style={{
          width: handleWidth,
          height: handleHeight,
          borderRadius: handleHeight / 2,
          backgroundColor: c.textSecondary,
        }}
      />
    </View>
  );
};

HandleBar.propTypes = {
  onClose: PropTypes.func.isRequired,
  accessibilityLabel: PropTypes.string,
  onLayout: PropTypes.func,
};

/**
 * The bar at the top of every sheet: the visible promise that it can be pulled
 * down, and a real control for anyone who cannot drag.
 *
 * Its colour is the theme's `textSecondary`, the colour the app's other
 * affordance icons wear (the reorder grip, search, the remove cross). It clears
 * the screen scope around it, so it is read from the app theme itself: screen
 * palettes redefine roles per screen, which made the same bar blue in one sheet
 * and grey in another under one theme.
 *
 * A screen reader user cannot drag, so to them it is a button that closes the
 * sheet. It is not tappable for everyone else: a stray touch on the bar must
 * not throw away a half-made pothi.
 */
export const SheetHandle = ({ onClose, accessibilityLabel = undefined, onLayout = undefined }) => (
  <ScreenRolesProvider screen={null}>
    <HandleBar onClose={onClose} accessibilityLabel={accessibilityLabel} onLayout={onLayout} />
  </ScreenRolesProvider>
);

SheetHandle.propTypes = {
  onClose: PropTypes.func.isRequired,
  /** Localised; defaults to "Close". */
  accessibilityLabel: PropTypes.string,
  onLayout: PropTypes.func,
};

/**
 * The gesture-handler root a Modal's content needs before any gesture in it
 * can fire on Android. Fills the Modal's window and draws nothing.
 */
export const SheetGestureRoot = ({ children }) => (
  <GestureHandlerRootView style={StyleSheet.absoluteFill}>{children}</GestureHandlerRootView>
);

SheetGestureRoot.propTypes = {
  children: PropTypes.node.isRequired,
};
