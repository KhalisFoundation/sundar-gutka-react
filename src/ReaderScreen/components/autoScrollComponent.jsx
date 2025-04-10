import React, { useState, useEffect } from "react";
import { View, Text, Animated, Platform } from "react-native";
import Slider from "@react-native-community/slider";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { colors, constant, actions, trackReaderEvent } from "@common";
import { styles } from "../styles";

const AutoScrollComponent = React.forwardRef(({ shabadID, isFooter }, ref) => {
  const [isPaused, togglePaused] = useState(true);
  const autoScrollSpeedObj = useSelector((state) => state.autoScrollSpeedObj);
  const [currentSpeed, setCurrentSpeed] = useState(
    autoScrollSpeedObj[shabadID] || constant.DEFAULT_SPEED
  );
  const [animationPosition] = useState(new Animated.Value(0));
  const dispatch = useDispatch();

  useEffect(() => {
    const value = isFooter ? 0 : 130;
    Animated.timing(animationPosition, {
      toValue: value,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isFooter]);

  useEffect(() => {
    const autoScrollObj = {
      autoScroll: isPaused ? 0 : currentSpeed,
      scrollMultiplier: 1.0,
    };
    if (ref && ref.current && ref.current.postMessage) {
      ref.current.postMessage(JSON.stringify(autoScrollObj));
    }
  }, [isPaused, currentSpeed]);

  const handleSpeed = (value) => {
    dispatch(actions.setAutoScrollSpeed(value, shabadID));
    if (value === 0) {
      togglePaused(true);
    }
  };
  const handlePause = () => {
    togglePaused(true);
  };
  const handlePlay = () => {
    togglePaused(false);
  };

  const bottomSpace = Platform.OS === "ios" ? 10 : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: animationPosition }], paddingBottom: bottomSpace },
      ]}
    >
      <View style={styles.wrapper}>
        {isPaused && (
          <Icon name="play-arrow" color={colors.TOOLBAR_TINT} size={30} onPress={handlePlay} />
        )}
        {!isPaused && (
          <Icon name="pause" color={colors.TOOLBAR_TINT} size={30} onPress={handlePause} />
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
          onValueChange={(value) => {
            setCurrentSpeed(value);
          }}
          onSlidingComplete={(value) => {
            handleSpeed(value);
            trackReaderEvent("autoScrollSpeed", value);
          }}
        />
        <Text style={styles.sliderText}>{currentSpeed}</Text>
      </View>
    </Animated.View>
  );
});
AutoScrollComponent.propTypes = {
  shabadID: PropTypes.number.isRequired,
  isFooter: PropTypes.bool.isRequired,
};
export default AutoScrollComponent;
