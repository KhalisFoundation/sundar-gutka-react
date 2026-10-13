import React, { useRef, useState, useCallback, useEffect } from "react";
import { Animated, Platform, StyleSheet } from "react-native";
import { withAlpha } from "@theme/colorUtils";
import { brandMarks } from "@theme/palette";
import useTheme from "@common/context";

// iOS does not expose the native scroll-indicator colour (only default/black/
// white), so on iOS we hide the native indicator and draw our own to match the
// Android themed scrollbar exactly. On Android this hook is a no-op by default —
// the native themed scrollbar (res/values/colors.xml → scrollbar_thumb) already
// renders.
//
// PASS A COLOUR and it draws on BOTH platforms instead. A caller does that when
// the thumb has to follow a reading theme, because neither platform's native
// indicator can: Android's comes from that static app resource, and iOS offers
// only default/black/white. Same reason ReaderScrollbar exists for the Reader.
const IS_IOS = Platform.OS === "ios";
// One fixed muted blue at 50% in BOTH themes — it has to match the Android
// native scrollbar (colors.xml → scrollbar_thumb), which is a single value and
// cannot follow the theme. Deriving it from the accent gave iOS two colours
// where Android had one.
const THUMB_COLOR = withAlpha(brandMarks.scrollThumb, 0.5);
const THUMB_WIDTH = 3;
const MIN_THUMB_HEIGHT = 36;
const FADE_OUT_DELAY_MS = 1200;

const styles = StyleSheet.create({
  thumb: {
    position: "absolute",
    top: 0,
    right: 2,
    width: THUMB_WIDTH,
    borderRadius: THUMB_WIDTH / 2,
  },
});

/**
 * Returns props to spread onto an Animated.ScrollView / Animated.FlatList and a
 * ready-to-render <Indicator> element. Render the scrollable and the indicator
 * as siblings inside a `flex: 1` (relatively positioned) wrapper:
 *
 *   const { scrollViewProps, Indicator } = useCustomScrollbar();
 *
 * @param {string} [color] Thumb colour. Supplying one also makes the indicator
 *   draw on ANDROID, where the native bar takes a static app resource and so
 *   cannot follow a reading theme.
 *   <View style={{ flex: 1 }}>
 *     <Animated.FlatList {...scrollViewProps} ... />
 *     {Indicator}
 *   </View>
 */
export const useCustomScrollbar = (color = null, { onOffset = null } = {}) => {
  // A caller that also needs the scroll offset in JS — a sheet deciding whether
  // its list is at the top — hears it from the SAME scroll event. The event is
  // native-driven and built once, so it cannot be wrapped; it calls through a
  // ref instead, which always holds the latest callback.
  const onOffsetRef = useRef(onOffset);
  onOffsetRef.current = onOffset;
  // Under a DESIGNED theme every list in the app gets a themed thumb, drawn on
  // both platforms — Android's native bar takes a static app resource and so
  // cannot follow one. Under Light, Dark and Default nothing changes: the
  // native bar already matches THUMB_COLOR, and drawing our own on Android
  // would only give the two platforms slightly different bars.
  const { theme } = useTheme();
  const themed = theme?.designedTheme ? withAlpha(theme.c.textBrand, 0.45) : null;
  const thumb = color ?? themed ?? THUMB_COLOR;
  const scrollY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const fadeTimer = useRef(null);
  const animRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Mimic the native fade: appear while scrolling, fade out shortly after idle.
  const showThenFade = useCallback(() => {
    animRef.current = Animated.timing(opacity, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    });
    animRef.current.start();
    if (fadeTimer.current) {
      clearTimeout(fadeTimer.current);
    }
    fadeTimer.current = setTimeout(() => {
      animRef.current = Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      });
      animRef.current.start();
    }, FADE_OUT_DELAY_MS);
  }, [opacity]);

  useEffect(
    () => () => {
      if (fadeTimer.current) {
        clearTimeout(fadeTimer.current);
      }
      // Stop any in-flight native-driven fade on unmount. Left running (e.g. the
      // user navigates away mid-scroll), the driver keeps updating props on a
      // node whose backing value may already be torn down, crashing in
      // PropsAnimatedNode.updateView with "Mapped property node does not exist".
      animRef.current?.stop();
    },
    []
  );

  const onScroll = useRef(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: true,
      listener: (event) => {
        showThenFade();
        onOffsetRef.current?.(event.nativeEvent.contentOffset.y);
      },
    })
  ).current;

  // Android's native bar is already themed by the app resource, so it is left
  // alone UNLESS a caller needs a colour that resource cannot provide.
  if (!IS_IOS && !color && !themed) {
    return { scrollViewProps: {}, Indicator: null, ownedScrollProps: {} };
  }

  const onContentSizeChange = (_w, h) => setContentHeight(h);
  const onLayout = (e) => setContainerHeight(e.nativeEvent.layout.height);

  const scrollViewProps = {
    showsVerticalScrollIndicator: false,
    scrollEventThrottle: 16,
    onScroll,
    onContentSizeChange,
    onLayout,
  };

  // For a list that OWNS its own onScroll and will not give it up.
  //
  // DraggableFlatList is the case: it spreads the caller's props and then sets
  // `onScroll={scrollHandler}` after them (its own Reanimated handler), so the
  // handler above is silently dropped and the thumb never moves. It does expose
  // `onScrollOffsetChange`, which reports the offset from JS — enough to drive
  // the same Animated.Value by hand. Same thumb, same fade, same colour; only
  // how the offset arrives differs, so there is still one scrollbar in the app.
  const ownedScrollProps = {
    showsVerticalScrollIndicator: false,
    onContentSizeChange,
    onLayout,
    onScrollOffsetChange: (y) => {
      scrollY.setValue(y);
      showThenFade();
    },
  };

  const scrollable = containerHeight > 0 && contentHeight > containerHeight;
  const thumbHeight = scrollable
    ? Math.max(MIN_THUMB_HEIGHT, (containerHeight * containerHeight) / contentHeight)
    : 0;
  const translateY = scrollY.interpolate({
    inputRange: [0, Math.max(1, contentHeight - containerHeight)],
    outputRange: [0, Math.max(0, containerHeight - thumbHeight)],
    extrapolate: "clamp",
  });

  const Indicator = scrollable ? (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.thumb,
        {
          height: thumbHeight,
          backgroundColor: thumb,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  ) : null;

  return { scrollViewProps, Indicator, ownedScrollProps };
};

export default useCustomScrollbar;
