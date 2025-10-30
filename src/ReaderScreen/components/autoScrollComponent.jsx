import React, { useState, useEffect, useCallback } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Slider from "@react-native-community/slider";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import {
  useTheme,
  useThemedStyles,
  constant,
  actions,
  trackReaderEvent,
  logError,
  CustomText,
  colors,
} from "@common";
import createStyles from "../styles";

const AutoScrollComponent = ({ shabadID, webViewRef }) => {
  const { theme } = useTheme();
  const [isPaused, togglePaused] = useState(true);
  const autoScrollSpeedObj = useSelector((state) => state.autoScrollSpeedObj);
  const [currentSpeed, setCurrentSpeed] = useState(
    autoScrollSpeedObj[shabadID] || constant.DEFAULT_SPEED
  );
  const dispatch = useDispatch();
  const styles = useThemedStyles(createStyles);

  // Handle auto-scroll state changes
  useEffect(() => {
    const autoScrollObj = {
      autoScroll: isPaused ? 0 : currentSpeed,
      scrollMultiplier: 1.0,
    };

    if (webViewRef?.current?.postMessage) {
      try {
        webViewRef.current.postMessage(JSON.stringify(autoScrollObj));
      } catch (error) {
        logError("Error sending auto-scroll message:", error);
      }
    }
  }, [isPaused, currentSpeed, webViewRef]);

  const handleSpeed = useCallback(
    (value) => {
      dispatch(actions.setAutoScrollSpeed(value, shabadID));
      if (value === 0) {
        togglePaused(true);
      }
    },
    [dispatch, shabadID]
  );

  const handlePause = useCallback(() => {
    togglePaused(true);
  }, []);

  const handlePlay = useCallback(() => {
    togglePaused(false);
  }, []);

  const handleValueChange = useCallback((value) => {
    setCurrentSpeed(value);
  }, []);

  const handleSlidingComplete = useCallback(
    (value) => {
      handleSpeed(value);
      trackReaderEvent("autoScrollSpeed", value);
    },
    [handleSpeed]
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.primary,
        },
      ]}
    >
      <View style={styles.wrapper}>
        {isPaused ? (
          <Icon
            name="play-arrow"
            color={theme.staticColors.WHITE_COLOR}
            size={30}
            onPress={handlePlay}
            accessibilityLabel="Play auto-scroll"
          />
        ) : (
          <Icon
            name="pause"
            color={theme.staticColors.WHITE_COLOR}
            size={30}
            onPress={handlePause}
            accessibilityLabel="Pause auto-scroll"
          />
        )}
        <Slider
          style={styles.slider}
          minimumTrackTintColor={colors.SLIDER_TRACK_MIN_TINT}
          maximumTrackTintColor={colors.SLIDER_TRACK_MAX_TINT}
          thumbTintColor={colors.WHITE_COLOR}
          minimumValue={1}
          maximumValue={100}
          step={1}
          value={currentSpeed}
          onValueChange={handleValueChange}
          onSlidingComplete={handleSlidingComplete}
          accessibilityLabel="Auto-scroll speed"
        />
        <CustomText style={styles.sliderText}>{currentSpeed}</CustomText>
      </View>
    </View>
  );
};

AutoScrollComponent.propTypes = {
  shabadID: PropTypes.number.isRequired,
  webViewRef: PropTypes.shape({
    current: PropTypes.shape({
      postMessage: PropTypes.func,
    }),
  }).isRequired,
};

export default React.memo(AutoScrollComponent);
