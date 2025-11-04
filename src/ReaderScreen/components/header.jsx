import React, { useEffect, useRef } from "react";
import { View, Animated, Pressable } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { BackArrowIcon, BookmarkIcon } from "@common/icons";
import { CustomText, useTheme, useThemedStyles } from "@common";
import createStyles from "../styles";

const Header = ({ title, handleBackPress, handleBookmarkPress, isHeader }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const fontFace = useSelector((state) => state.fontFace);
  const animationPosition = useRef(new Animated.Value(0)).current;

  const MID = "rgba(17,57,121,1)"; // #113979
  const EDGE = "rgba(17,57,121,0)";

  const headerLeft = () => (
    <Pressable
      onPress={() => {
        handleBackPress();
      }}
    >
      <BackArrowIcon size={25} color={theme.colors.primaryHeaderVariant} />
    </Pressable>
  );

  const headerRight = () => (
    <Pressable
      onPress={() => {
        handleBookmarkPress();
      }}
    >
      <BookmarkIcon size={25} color={theme.colors.primaryHeaderVariant} />
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
      <View style={styles.headerStyle} pointerEvents="auto">
        <View style={styles.headerWrapper}>
          <View style={styles.headerLeft}>{headerLeft()}</View>
          <View style={styles.headerCenter}>
            <CustomText style={[styles.headerTitleStyle, { fontFamily: fontFace }]}>
              {title}
            </CustomText>
          </View>
          <View style={styles.headerRight}>{headerRight()}</View>
        </View>
      </View>
      <LinearGradient
        colors={[EDGE, MID, MID, EDGE]}
        locations={[0, 0.48, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          width: "100%",
          height: 1.2,
          pointerEvents: "none",
        }}
      />
    </Animated.View>
  );
};

Header.propTypes = {
  title: PropTypes.string.isRequired,
  handleBackPress: PropTypes.func.isRequired,
  handleBookmarkPress: PropTypes.func.isRequired,
  isHeader: PropTypes.bool.isRequired,
};
export default Header;
