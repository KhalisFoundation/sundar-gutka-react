import React, { useState, useEffect, useRef } from "react";
import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import colors from "../../common/colors";
import { styles } from "../styles";
import constant from "../../common/constant";
import { setAutoScrollSpeed } from "../../common/actions";

function AutoScrollComponent({ shabadID, readerRef, offset }) {
  const [isPaused, togglePaused] = useState(true);
  const { autoScrollSpeedObj } = useSelector((state) => state);
  const [scrollSpeed, setScrollSpeed] = useState(autoScrollSpeedObj[shabadID]);
  const currentSpeed = autoScrollSpeedObj[shabadID] || constant.DEFAULT_SPEED;
  const dispatch = useDispatch();
  const scrollMultiplier = 1;

  const autoScrollTimeout = useRef(null);
  const handleSpeed = (value) => {
    setScrollSpeed(value);
    dispatch(setAutoScrollSpeed(value, shabadID));
    if (value === 0) {
      togglePaused(true);
    }
  };
  const clearScrollTimeout = () => {
    clearTimeout(autoScrollTimeout.current);
  };
  const handlePause = () => {
    clearScrollTimeout();
    togglePaused(true);
  };
  const handlePlay = () => {
    togglePaused(false);
  };

  useEffect(() => {
    const setAutoScroll = () => {
      console.log("Offset.previous", offset);
      offset.current += 10;
      console.log("offset.current", offset.current);
      readerRef.current?.scrollTo({ x: 0, y: offset.current, animated: true });
      autoScrollTimeout.current = setTimeout(() => {
        setAutoScroll();
        offset.current += 20;
      }, (200 - scrollSpeed * 2) / scrollMultiplier);
    };
    if (!isPaused) {
      setAutoScroll();
    } else {
      clearScrollTimeout();
    }
    return () => {
      clearScrollTimeout();
    };
  }, [isPaused, scrollSpeed]);

  return (
    <View style={styles.container}>
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
          value={currentSpeed}
          onValueChange={(value) => {
            handleSpeed(value);
          }}
          step={1}
        />
        <Text style={styles.sliderText}>{currentSpeed}</Text>
      </View>
    </View>
  );
}
AutoScrollComponent.propTypes = {
  shabadID: PropTypes.number.isRequired,
  readerRef: PropTypes.shape().isRequired,
  offset: PropTypes.shape().isRequired,
};
export default AutoScrollComponent;
