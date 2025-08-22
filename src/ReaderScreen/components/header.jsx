import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "../styles";

const Header = ({ title, handleBackPress, handleBookmarkPress, handleSettingsPress, isHeader }) => {
  const { theme } = useTheme();
  const isDatabaseUpdateAvailable = useSelector((state) => state.isDatabaseUpdateAvaliable);
  const styles = useThemedStyles(createStyles);
  const animationPosition = useRef(new Animated.Value(0)).current;

  const headerLeft = () => (
    <Icon
      name="arrow-back"
      size={30}
      onPress={() => {
        handleBackPress();
      }}
      color={theme.staticColors.WHITE_COLOR}
    />
  );

  const headerRight = () => (
    <View style={{ flexDirection: "row" }}>
      <Icon
        name="bookmark"
        color={theme.staticColors.WHITE_COLOR}
        size={30}
        onPress={handleBookmarkPress}
      />
      <Icon
        name={isDatabaseUpdateAvailable ? "settings-suggest" : "settings"}
        color={theme.staticColors.WHITE_COLOR}
        size={30}
        onPress={() => handleSettingsPress()}
      />
    </View>
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
      <View style={styles.headerStyle} pointerEvents="auto">
        <View style={styles.headerWrapper}>
          {headerLeft()}
          <Text style={styles.headerTitleStyle}>{title}</Text>
          {headerRight()}
        </View>
      </View>
    </Animated.View>
  );
};

Header.propTypes = {
  title: PropTypes.string.isRequired,
  handleBackPress: PropTypes.func.isRequired,
  handleBookmarkPress: PropTypes.func.isRequired,
  handleSettingsPress: PropTypes.func.isRequired,
  isHeader: PropTypes.bool.isRequired,
};
export default Header;
