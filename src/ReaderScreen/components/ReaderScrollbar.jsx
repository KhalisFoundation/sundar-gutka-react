import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import PropTypes from "prop-types";

// A themed vertical scroll indicator drawn in React Native, over the WebView.
//
// WHY IT IS DRAWN AT ALL. ::-webkit-scrollbar cannot style this: on Android the
// root scroller's bar is drawn by the Android system, not the WebView, so the
// CSS is never consulted (crbug 40226034); the pseudo-element is also deprecated
// and non-standard, and custom scrollbars stopped working on iOS 14. The native
// indicator is no better — its colour comes from a static app resource
// (res/values/colors.xml → scrollbar_thumb) that cannot vary per reading theme.
// Drawing it is the only way to tint it. The app already does the same for
// ScrollViews on iOS — see common/components/ScrollIndicator.
//
// BEHAVIOUR follows the platform conventions rather than being invented:
//
//  • PROPORTIONAL THUMB. Its length is the ratio of the visible viewport to the
//    total content, so if a quarter of the bani is on screen the thumb fills a
//    quarter of the track. That is what tells a reader how long Sukhmani is
//    versus a short bani — a fixed-size thumb throws that signal away.
//
//  • MINIMUM LENGTH. Clamped so a very long bani still leaves something
//    visible instead of a one-pixel sliver.
//
//  • HIDDEN WHEN EVERYTHING FITS. A visible scrollbar implies more content;
//    showing one on a bani that does not scroll is a false promise.
//
//  • APPEARS ON SCROLL, FADES WHEN IDLE. Both Material and Apple's HIG describe
//    the mobile indicator as an overlay that appears once scrolling starts and
//    does not occupy layout space.
//
// Position rides the same Animated.Value as the Reader's bottom progress bar,
// which is already known to track scrolling correctly on device.

const MIN_THUMB_HEIGHT = 32;
const IDLE_FADE_MS = 1200;
const FADE_IN_MS = 120;
const FADE_OUT_MS = 320;

const styles = StyleSheet.create({
  track: {
    position: "absolute",
    // `end` rather than `right` so the indicator mirrors under RTL.
    end: 2,
    width: 12,
    alignItems: "flex-end",
    // Over the page, under all of the Reader's chrome. At 12 it outranked the
    // header and bottom nav (10) and the progress track (11), so with the bars
    // up the thumb ran across them at either end of a bani.
    //
    // Deliberately no `elevation`. On Android elevation outranks zIndex, and
    // the header's wrapper has none of its own: any elevation here would put
    // the thumb back over the header on Android while iOS drew it underneath.
    // Left at zero, Android orders it by zIndex under the header, and the
    // bottom chrome's elevations keep those layers above it.
    zIndex: 1,
  },
});

const ReaderScrollbar = ({
  progress,
  color,
  width,
  visibleFraction = 1,
  topInset = 60,
  bottomInset = 10,
}) => {
  const [trackHeight, setTrackHeight] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const idleTimer = useRef(null);

  useEffect(() => {
    const fadeOutAfterIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_OUT_MS,
          useNativeDriver: true,
        }).start();
      }, IDLE_FADE_MS);
    };

    const id = progress.addListener(() => {
      opacity.stopAnimation();
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        useNativeDriver: true,
      }).start();
      fadeOutAfterIdle();
    });

    return () => {
      progress.removeListener(id);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      opacity.stopAnimation();
    };
  }, [progress, opacity]);

  // The whole bani already fits — there is nothing to indicate, and showing a
  // scrollbar would imply content that is not there.
  if (visibleFraction >= 1) return null;

  const thumbHeight = Math.max(MIN_THUMB_HEIGHT, Math.round(trackHeight * visibleFraction));
  const travel = trackHeight - thumbHeight;

  return (
    <Animated.View
      pointerEvents="none"
      // Decorative: it duplicates scroll state a screen reader already conveys.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0 && h !== trackHeight) setTrackHeight(h);
      }}
      style={[styles.track, { top: topInset, bottom: bottomInset, opacity }]}
    >
      {travel > 0 ? (
        <Animated.View
          style={{
            height: thumbHeight,
            width,
            borderRadius: width / 2,
            backgroundColor: color,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, travel],
                  extrapolate: "clamp",
                }),
              },
            ],
          }}
        />
      ) : null}
    </Animated.View>
  );
};

ReaderScrollbar.propTypes = {
  // The Reader's scroll fraction (0–1). Shared with the bottom progress bar.
  progress: PropTypes.instanceOf(Animated.Value).isRequired,
  // Fraction of the bani visible on screen (0–1]. 1 means it all fits.
  visibleFraction: PropTypes.number,
  color: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  topInset: PropTypes.number,
  bottomInset: PropTypes.number,
};

export { MIN_THUMB_HEIGHT };
export default ReaderScrollbar;
