import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Path, Polyline } from "react-native-svg";
import PropTypes from "prop-types";

/**
 * Refresh glyph that spins while a refetch is in flight.
 *
 * Deliberately NOT an ActivityIndicator: that maps to a native widget whose
 * Android behaviour is unreliable — one mounted as animating={false} stays
 * hidden even after the prop flips (facebook/react-native#9023), and there are
 * device reports of it not drawing at all. Rotating the icon we already show is
 * also the clearer affordance, since the control keeps its identity instead of
 * being swapped for an unrelated shape.
 *
 * The rotation is a transform, so it runs on the native driver — identical on
 * iOS and Android, on the UI thread, and it costs no re-renders while looping.
 */
const SPIN_DURATION_MS = 850;

const RefreshSpinner = ({ color, size = 15, spinning = false }) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spinning) {
      spin.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: SPIN_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinning, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M21 12a9 9 0 1 1-3.05-6.75" />
        <Polyline points="21 3 21 8 16 8" />
      </Svg>
    </Animated.View>
  );
};

RefreshSpinner.propTypes = {
  color: PropTypes.string.isRequired,
  size: PropTypes.number,
  spinning: PropTypes.bool,
};

export default RefreshSpinner;
