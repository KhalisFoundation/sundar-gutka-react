import React, { useCallback, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import Card from "./Card";
import Spinner from "./Spinner";

/**
 * The app's ONE pull-to-refresh, for any scrolling thing.
 *
 * Drawn by hand rather than wrapping a platform refresh control, because
 * neither control can work inside a `DraggableFlatList` — and a screen that
 * cannot have one would otherwise grow a second, divergent implementation:
 *
 *   gesture-handler's  is a native handler declared `disallowInterruption`, and
 *                      gesture-handler's FlatList makes the scroll view
 *                      `waitFor` it. It holds the vertical channel in BOTH
 *                      directions, so the list does not scroll at all.
 *   React Native's     is a SwipeRefreshLayout WRAPPING the scroll view, so it
 *                      sits outside the list's own drag pan. That pan takes the
 *                      touch first and the pull never arrives.
 *
 * Both verified on a Pixel 9. A pan arbitrates with a list on equal terms, and
 * is armed only where a pull can mean nothing else: at the very top, travelling
 * down. `activeOffsetY` given a single positive value sets the END threshold
 * alone, so an upward drag never reaches this gesture and scrolling is
 * untouched. A list whose own scroll view would otherwise claim the touch first
 * is handed `gestureRef` to run simultaneously with.
 *
 * The badge is the app's own `Card` and the arc its own `Spinner`. Its surface
 * is the GROUND IT FLOATS OVER, not a semantic role: the screens that have a
 * pull draw on a screen-scoped palette, so a badge taking `c.surface` came
 * from a different colour system than the list behind it and drifted out of
 * family in every theme — white on a white bani list, neutral grey on the navy
 * one, and off-hue under a designed theme. Taking the ground cannot mismatch,
 * whatever the theme, and a hairline border is what separates it.
 *
 * The border does the work a shadow would, because Android has no other way
 * to raise a round view than `elevation`, and `elevation` tessellates a small
 * circle's shadow into a visible octagon.
 *
 * iOS shows the arc bare, as UIRefreshControl does, so there is no badge there.
 */

/** Finger travel, in points. */
const ARM = 8; // below a draggable list's own activationDistance, so the pull claims the touch
const TRIGGER = 72; // far enough down that letting go starts the refresh
const MAX = 112; // the spinner comes no further, however far the finger does
const REST = 56; // where it waits while the refresh runs
const DAMPING = 0.5; // it follows at half the finger's speed, so the pull resists
const DISC = 40;

const IS_IOS = Platform.OS === "ios";

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // Clips the parked badge. The badge sits a full circle ABOVE the content and
  // is solid, so without this it shows in whatever is above the list and spins
  // there forever. This is the frame it is revealed through, exactly as
  // SwipeRefreshLayout reveals its own circle.
  frame: { flex: 1, overflow: "hidden" },
  // Parked just above the content, so nothing of it shows until it is pulled.
  spinner: { position: "absolute", alignSelf: "center", top: -DISC, zIndex: 1 },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});

const PullToRefresh = ({
  onRefresh,
  atTop,
  surface,
  enabled = true,
  gestureRef = undefined,
  children,
}) => {
  const { c } = useTokens();
  const [refreshing, setRefreshing] = useState(false);
  // How far the spinner has been pulled down, driven on the UI thread.
  const pull = useSharedValue(0);

  const run = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      pull.value = withTiming(0);
    }
  }, [onRefresh, pull]);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(enabled && atTop && !refreshing)
      .activeOffsetY(ARM)
      // A sideways drag belongs to whatever swipes between screens above.
      .failOffsetX([-24, 24])
      .onUpdate((event) => {
        pull.value = Math.min(MAX, Math.max(0, event.translationY * DAMPING));
      })
      .onEnd(() => {
        if (pull.value < TRIGGER) {
          pull.value = withTiming(0);
          return;
        }
        pull.value = withTiming(REST);
        runOnJS(run)();
      });
    return gestureRef ? pan.withRef(gestureRef) : pan;
  }, [enabled, atTop, refreshing, run, pull, gestureRef]);

  // No fade: the badge is parked a full circle above the content, so it is
  // hidden until it is pulled and is solid the whole way down. Fading it in
  // composited it against the ground and washed the surface out.
  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pull.value }],
  }));

  return (
    <View style={styles.frame}>
      <Animated.View pointerEvents="none" style={[styles.spinner, spinnerStyle]}>
        {IS_IOS ? (
          <Spinner color={c.textPrimary} />
        ) : (
          <Card
            padded={false}
            elevation="none"
            surface={surface}
            style={[styles.disc, { borderColor: c.border }]}
          >
            <Spinner color={c.textPrimary} />
          </Card>
        )}
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <View style={styles.fill}>{children}</View>
      </GestureDetector>
    </View>
  );
};

PullToRefresh.propTypes = {
  /** Runs the refresh. The spinner waits on the promise it returns. */
  onRefresh: PropTypes.func.isRequired,
  /** Whether the content is scrolled to its top — the only place a pull arms. */
  atTop: PropTypes.bool.isRequired,
  /** The ground the badge floats over, so it can never be out of family. */
  surface: PropTypes.string.isRequired,
  /** False where there is nothing to refresh, or while a drag owns the touch. */
  enabled: PropTypes.bool,
  /**
   * A ref the gesture is published on, for a list that has to be told to scroll
   * simultaneously with it (DraggableFlatList's `simultaneousHandlers`).
   */
  gestureRef: PropTypes.shape({}),
  children: PropTypes.node.isRequired,
};

export default PullToRefresh;
