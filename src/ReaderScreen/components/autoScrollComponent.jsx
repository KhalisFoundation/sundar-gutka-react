import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Animated, Platform } from "react-native";
import Slider from "@react-native-community/slider";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { colors, constant, actions, trackReaderEvent, logError } from "@common";
import { styles } from "../styles";

const AutoScrollComponent = ({ shabadID, isFooter, webViewRef }) => {
  const [isPaused, togglePaused] = useState(true);
  const autoScrollSpeedObj = useSelector((state) => state.autoScrollSpeedObj);
  const [currentSpeed, setCurrentSpeed] = useState(
    autoScrollSpeedObj[shabadID] || constant.DEFAULT_SPEED
  );
  const [animationPosition] = useState(new Animated.Value(0));
  const dispatch = useDispatch();
  const animationRef = useRef(null);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  // Handle animation
  useEffect(() => {
    const value = isFooter ? 0 : 130;
    if (animationRef.current) {
      animationRef.current.stop();
    }
    animationRef.current = Animated.timing(animationPosition, {
      toValue: value,
      duration: 500,
      useNativeDriver: true,
    });
    animationRef.current.start((finished) => {
      if (!finished) {
        // If animation was interrupted, force the final value
        animationPosition.setValue(value);
      }
    });
  }, [isFooter, animationPosition]);

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

  // Add animation reset function to fix stuck states
  const resetAnimation = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    // Force animation to complete state
    const targetValue = isFooter ? 0 : 130;
    animationPosition.setValue(targetValue);
  }, [animationPosition, isFooter]);

  // Reset animation if it gets stuck (fallback)
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      // If animation seems stuck, reset it
      if (animationRef.current) {
        resetAnimation();
      }
    }, 1000); // Reset after 1 second if still animating

    return () => clearTimeout(resetTimer);
  }, [isFooter, resetAnimation]);

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

  const bottomSpace = Platform.OS === "ios" ? 10 : 0;

  return (
    <View>
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY: animationPosition }], paddingBottom: bottomSpace },
        ]}
        pointerEvents="box-none" // Ensure touch events pass through
      >
        <View style={styles.wrapper} pointerEvents="auto">
          {isPaused ? (
            <Icon
              name="play-arrow"
              color={colors.TOOLBAR_TINT}
              size={30}
              onPress={handlePlay}
              accessibilityLabel="Play auto-scroll"
            />
          ) : (
            <Icon
              name="pause"
              color={colors.TOOLBAR_TINT}
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
          <Text style={styles.sliderText}>{currentSpeed}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

AutoScrollComponent.propTypes = {
  shabadID: PropTypes.number.isRequired,
  isFooter: PropTypes.bool.isRequired,
  webViewRef: PropTypes.shape({
    current: PropTypes.shape({
      postMessage: PropTypes.func,
    }),
  }).isRequired,
};

export default React.memo(AutoScrollComponent);
