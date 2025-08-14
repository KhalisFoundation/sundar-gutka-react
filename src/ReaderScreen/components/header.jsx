import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Pressable } from "react-native";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import colors from "@common/colors";
import { BackArrowIcon } from "@common/icons";
import { getHeaderStyles, styles } from "../styles/styles";

const Header = ({ title, handleBackPress, isHeader }) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const getHeaderStyle = getHeaderStyles(isNightMode);
  const animationPosition = useRef(new Animated.Value(0)).current;

  const headerLeft = () => (
    <Pressable
      style={{ padding: 10 }}
      onPress={() => {
        handleBackPress();
      }}
    >
      <BackArrowIcon size={24} color={colors.READER_HEADER_COLOR} />
    </Pressable>
  );

  useEffect(() => {
    const value = isHeader ? 0 : -120;

    // Stop any existing animation first
    animationPosition.stopAnimation();

    const animation = Animated.timing(animationPosition, {
      toValue: value,
      duration: 500,
      useNativeDriver: true,
    });

    animation.start((finished) => {
      if (!finished) {
        // If animation was interrupted, force the final value
        animationPosition.setValue(value);
      }
    });

    // Cleanup function
    return () => {
      animation.stop();
    };
  }, [isHeader, animationPosition]);

  // Add animation reset as fallback for stuck states
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      // Force position if animation seems stuck
      const targetValue = isHeader ? 0 : -120;
      animationPosition.setValue(targetValue);
    }, 1000);

    return () => clearTimeout(resetTimer);
  }, [isHeader, animationPosition]);

  return (
    <Animated.View
      style={[
        styles.animatedView,
        {
          transform: [{ translateY: animationPosition }],
        },
      ]}
      pointerEvents="box-none" // Ensure touch events pass through
    >
      <View style={getHeaderStyle.headerStyle} pointerEvents="auto">
        <View style={styles.headerWrapper}>
          <View style={{ width: "20%" }}>{headerLeft()}</View>
          <View style={{ width: "60%" }}>
            <Text style={getHeaderStyle.headerTitleStyle}>{title}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

Header.propTypes = {
  title: PropTypes.string.isRequired,
  handleBackPress: PropTypes.func.isRequired,
  isHeader: PropTypes.bool.isRequired,
};
export default Header;
