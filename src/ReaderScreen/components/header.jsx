import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Pressable, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { BackArrowIcon } from "@common/icons";
import createStyles from "../styles";

const Header = ({ title, handleBackPress, isHeader }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const animationPosition = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const MID = "rgba(17,57,121,1)"; // #113979
  const EDGE = "rgba(17,57,121,0)";

  const headerLeft = () => (
    <Pressable
      style={{ padding: 10 }}
      onPress={() => {
        handleBackPress();
      }}
    >
      <BackArrowIcon size={24} color={theme.colors.primaryText} />
    </Pressable>
  );

  useEffect(() => {
    const value = isHeader ? insets.top : -120;

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
      const targetValue = isHeader ? insets.top : -120;
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
          <View style={{ width: "20%" }}>{headerLeft()}</View>
          <View style={{ width: "60%" }}>
            <Text style={styles.headerTitleStyle}>{title}</Text>
          </View>
        </View>
      </View>
      <LinearGradient
        colors={[EDGE, MID, MID, EDGE]}
        locations={[0, 0.48, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          width: "100%",
          height: StyleSheet.hairlineWidth,
          pointerEvents: "none",
        }}
      />
    </Animated.View>
  );
};

Header.propTypes = {
  title: PropTypes.string.isRequired,
  handleBackPress: PropTypes.func.isRequired,
  isHeader: PropTypes.bool.isRequired,
};
export default Header;
