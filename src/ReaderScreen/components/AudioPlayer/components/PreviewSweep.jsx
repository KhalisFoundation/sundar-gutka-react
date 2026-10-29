import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import PropTypes from "prop-types";

/**
 * Left-to-right sweep showing how much of an audio preview has played.
 *
 * Animates translateX rather than width. Only transform and opacity can run on
 * the native driver; a width animation has to cross to JS every frame, and
 * driving it from a 250ms interval advanced the fill in ~60 visible steps and
 * re-rendered the whole track list on each one. Here the fill is laid out at
 * full width and slid in from -width to 0 behind the parent's overflow clip,
 * so it interpolates on the UI thread and costs no re-renders at all.
 *
 * Self-contained on purpose: mounting it starts the sweep and unmounting stops
 * it, so it stays in step with the preview without the parent tracking
 * progress. It is purely decorative — the preview's own ticker still owns
 * stopping the audio at the end of the window.
 */
const PreviewSweep = ({ durationMs, trackStyle = null, fillStyle = null }) => {
  const [width, setWidth] = useState(0);
  const offset = useRef(new Animated.Value(0)).current;
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (!width) return undefined;
    if (!startedAtRef.current) startedAtRef.current = Date.now();

    // Resume from however much has already elapsed, so a re-layout mid-preview
    // (rotation, font-size change) does not send the sweep back to the start.
    const elapsed = Math.min(Date.now() - startedAtRef.current, durationMs);
    const remaining = Math.max(0, durationMs - elapsed);

    offset.setValue(-width * (1 - elapsed / durationMs));
    const animation = Animated.timing(offset, {
      toValue: 0,
      duration: remaining,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [width, durationMs, offset]);

  return (
    <View
      style={trackStyle}
      pointerEvents="none"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Animated.View style={[fillStyle, { width, transform: [{ translateX: offset }] }]} />
      )}
    </View>
  );
};

PreviewSweep.propTypes = {
  durationMs: PropTypes.number.isRequired,
  trackStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  fillStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default PreviewSweep;
