import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import PropTypes from "prop-types";
import useDashboardTheme from "./dashboardTheme";

// Lightweight pulsing placeholder shown only while a section's first data
// fetch is in flight (see useAsyncSection) — never re-shown after that.
const SkeletonBlock = ({ style = null }) => {
  const { c } = useDashboardTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // JS driver (useNativeDriver: false) is deliberate here. Many SkeletonBlocks
    // render at once across dashboard sections and then unmount together the
    // instant their data lands. With the native driver, that bulk teardown drops
    // native animated nodes while the NativeAnimatedModule ConcurrentOperationQueue
    // may still have a queued connectAnimatedNodes referencing one of them, which
    // crashes the app ("Animated node with tag (child) [N] does not exist").
    // A JS-thread opacity pulse never enters the native animated graph, so it
    // cannot trigger that race — and for a sub-second placeholder it looks
    // identical. See the connectAnimatedNodes Crashlytics reports.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { backgroundColor: c.surfaceSelected, opacity },
        style,
      ]}
    />
  );
};

SkeletonBlock.propTypes = { style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]) };

const styles = StyleSheet.create({
  base: { borderRadius: 8 },
});

export default SkeletonBlock;
