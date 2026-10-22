import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, Platform, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import PropTypes from "prop-types";

/**
 * The app's ONE loading spinner, and the same shape on both platforms.
 *
 * `ActivityIndicator` is a native widget, so it is a DIFFERENT shape on each.
 * Android draws the Material indicator — one arc turning smoothly. iOS draws
 * `UIActivityIndicatorView`, the twelve-spoke asterisk that fades each spoke in
 * turn, and beside this app's own rounded chrome that reads as a stray system
 * control rather than part of the design.
 *
 * ── Android is left completely alone ────────────────────────────────────────
 *
 * It already draws the wanted shape, so it keeps the real `ActivityIndicator`:
 * same widget, same props, same pixels as before this component existed. Only
 * iOS is given the drawn arc, and it is drawn to match what Android shows.
 *
 * The rotation is a transform on the native driver, so it runs on the UI thread
 * and costs no re-renders while it loops — these appear during exactly the work
 * (downloading, seeking, querying) that is already busy.
 *
 * `size` takes ActivityIndicator's own names so call sites read the same, and
 * the drawn values match what Android draws for them: small is 20dp, large 36.
 */
const SIZES = { small: 20, large: 36 };

const SPIN_DURATION_MS = 750;

/** How much of the circle the arc covers. A quarter is the Material sweep. */
const ARC = 0.25;

const Spinner = ({ color, size = "small", style = undefined, testID = undefined }) => {
  const spin = useRef(new Animated.Value(0)).current;

  // Hooks run on both platforms — the loop below is cheap and the rule against
  // conditional hooks is not worth a second component to dodge.
  useEffect(() => {
    if (Platform.OS !== "ios") return undefined;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: SPIN_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    // Stop on unmount, or the native driver keeps updating a node whose backing
    // value is being torn down — these mount and unmount constantly.
    return () => loop.stop();
  }, [spin]);

  if (Platform.OS !== "ios") {
    return <ActivityIndicator size={size} color={color} style={style} testID={testID} />;
  }

  const box = typeof size === "number" ? size : SIZES[size];
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  // Stroke scales with the box so a large spinner is not a hairline, and the
  // radius is inset by half of it so the stroke cannot be clipped by the edge.
  const strokeWidth = Math.max(2, Math.round(box / 9));
  const radius = (box - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={style} testID={testID}>
      <Animated.View style={{ width: box, height: box, transform: [{ rotate }] }}>
        <Svg width={box} height={box}>
          <Circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            // One dash the length of the arc, then a gap long enough that the
            // pattern never repeats within the circle — so exactly one ray.
            strokeDasharray={`${circumference * ARC} ${circumference}`}
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

Spinner.propTypes = {
  /** Always from the theme — this is chrome, so it follows the surface it sits on. */
  color: PropTypes.string.isRequired,
  /** ActivityIndicator's names, or an explicit pixel box. */
  size: PropTypes.oneOfType([PropTypes.oneOf(["small", "large"]), PropTypes.number]),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  testID: PropTypes.string,
};

export default Spinner;
