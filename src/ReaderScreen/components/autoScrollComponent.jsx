import React, { useState, useEffect, useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import { useIsFocused } from "@react-navigation/native";
import PropTypes from "prop-types";
import {
  useTheme,
  constant,
  actions,
  trackReaderEvent,
  logError,
  CustomText,
  STRINGS,
} from "@common";

import { withAlpha } from "@theme/colorUtils";
import { Slider } from "@miblanchard/react-native-slider";

const AutoScrollComponent = ({ shabadID, webViewRef, webViewLoadTick = 0, onActivity = undefined }) => {
  const { theme } = useTheme();
  const isFocused = useIsFocused();
  const [isPaused, togglePaused] = useState(true);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
  // One speed for every bani. It used to be kept per bani, so 67% chosen in
  // Jaap Sahib meant nothing in Japji Sahib and each bani opened at the
  // default again. Persisted, so it also survives switching auto-scroll off
  // and on.
  const autoScrollSpeed = useSelector((state) => state.autoScrollSpeed);
  // The per-bani map it replaced, read only to carry an existing install's
  // choice forward: this bani's own value if it had one, else whatever was
  // last chosen anywhere. Nothing writes it any more.
  const legacySpeeds = useSelector((state) => state.autoScrollSpeedObj) ?? {};
  const savedSpeed =
    autoScrollSpeed ??
    legacySpeeds[shabadID] ??
    Object.values(legacySpeeds).pop() ??
    constant.DEFAULT_SPEED;

  const [sliderValue, setSliderValue] = useState(savedSpeed);
  const dispatch = useDispatch();

  // Send a stop signal to the WebView to halt auto-scroll
  const sendStopSignal = useCallback(() => {
    if (webViewRef?.current?.postMessage) {
      try {
        webViewRef.current.postMessage(JSON.stringify({ autoScroll: 0 }));
      } catch (error) {
        logError("Error sending auto-scroll stop:", error);
      }
    }
  }, [webViewRef]);

  // Send auto-scroll state to WebView — pauses when screen loses focus, resumes on return.
  // webViewLoadTick is included so we re-send after a WebView remount (e.g. paragraph
  // mode/larivaar toggled in Settings): on iOS postMessages sent before the fresh
  // WKWebView is ready get dropped, so without this the scroll silently stalls.
  useEffect(() => {
    // If screen not focused, manually paused, or auto-scroll disabled, send stop signal
    const shouldScroll = isFocused && !isPaused && isAutoScroll;
    const speed = shouldScroll ? sliderValue : 0;
    const autoScrollObj = { autoScroll: speed };

    if (webViewRef?.current?.postMessage) {
      try {
        webViewRef.current.postMessage(JSON.stringify(autoScrollObj));
      } catch (error) {
        logError("Error sending auto-scroll message:", error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, sliderValue, isFocused, isAutoScroll, webViewLoadTick]);

  // Send stop signal on unmount so the WebView doesn't keep scrolling
  // after the component is removed (e.g. when user switches to Audio mode)
  useEffect(() => {
    return () => {
      sendStopSignal();
    };
  }, [sendStopSignal]);

  const handleSlidingComplete = useCallback(
    (valueArr) => {
      const val = Math.floor(valueArr[0]);
      dispatch(actions.setAutoScrollSpeed(val));
      trackReaderEvent("autoScrollSpeed", val);
      onActivity?.();
    },
    [dispatch, onActivity]
  );

  const handlePause = useCallback(() => {
    togglePaused(true);
    onActivity?.();
  }, [onActivity]);

  const handlePlay = useCallback(() => {
    togglePaused(false);
    onActivity?.();
  }, [onActivity]);

  const barBg = theme.c.primary;
  const textColor = theme.c.onPrimary;

  return (
    <View
      style={[localStyles.outerContainer, { backgroundColor: barBg, shadowColor: theme.c.shadow }]}
    >
      <View style={localStyles.row}>
        {/* Play/Pause */}
        <Pressable
          onPress={isPaused ? handlePlay : handlePause}
          hitSlop={8}
          accessibilityLabel={isPaused ? STRINGS.AUTO_SCROLL_PLAY : STRINGS.AUTO_SCROLL_PAUSE}
        >
          <Icon
            name={isPaused ? "play-arrow" : "pause"}
            color={textColor}
            size={24}
          />
        </Pressable>

        {/* Slider */}
        <View style={localStyles.sliderWrapper}>
          <Slider
            value={sliderValue}
            minimumValue={1}
            maximumValue={100}
            step={1}
            onValueChange={(val) => {
              setSliderValue(Math.floor(val[0]));
              onActivity?.();
            }}
            onSlidingComplete={handleSlidingComplete}
            thumbStyle={localStyles.sliderThumb}
            // The library's own prop, NOT a backgroundColor in `thumbStyle`.
            // It renders the thumb as { backgroundColor: thumbTintColor, ...thumbStyle },
            // so an ARRAY passed as thumbStyle spreads to { 0: ..., 1: ... } and the
            // colour inside it is silently dropped — leaving the default #343434,
            // which is why the dot stayed blackish grey.
            thumbTintColor={textColor}
            trackStyle={localStyles.sliderTrack}
            minimumTrackTintColor={textColor}
            maximumTrackTintColor={withAlpha(theme.c.onPrimary, 0.3)}
          />
        </View>

        {/* Current Speed Value */}
        <CustomText style={[localStyles.currentValueText, { color: textColor }]}>
          {sliderValue}
        </CustomText>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  outerContainer: {
    width: "100%",
    maxWidth: 500,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
  },
  sliderWrapper: {
    flex: 1,
    marginHorizontal: 16,
    justifyContent: "center",
  },
  sliderTrack: {
    height: 2,
    borderRadius: 1,
  },
  sliderThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    // No shadow, and the fill comes from the theme at the call site.
    //
    // The dot and the filled track are the SAME white (`c.onPrimary`), but a
    // black shadow under a 12pt dot darkened its edges enough that it read as a
    // duller grey than the track it sits on. There is nothing for it to lift off
    // either — the bar behind it is one solid fill.
  },
  currentValueText: {
    fontSize: 16,
    fontWeight: "normal",
    minWidth: 36,
    textAlign: "right",
  },
});

AutoScrollComponent.propTypes = {
  /** Only used to look up this bani's speed in the old per-bani map. */
  shabadID: PropTypes.number.isRequired,
  webViewRef: PropTypes.shape({
    current: PropTypes.shape({
      postMessage: PropTypes.func,
    }),
  }).isRequired,
  webViewLoadTick: PropTypes.number,
  onActivity: PropTypes.func,
};

export default React.memo(AutoScrollComponent);
