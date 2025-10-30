import React from "react";
import { Animated, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import PropTypes from "prop-types";
import { CustomText, useTheme, useThemedStyles } from "@common";
import createStyles from "../styles";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DownloadAnimation = ({ progress, progressAnim }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  return (
    <View style={styles.progressContainer}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        {/* Rotate the group, not individual circles */}
        <G rotation="-90" origin="60, 60">
          <Circle
            cx="60"
            cy="60"
            r={radius}
            stroke={theme.colors.surfaceGrey}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx="60"
            cy="60"
            r={radius}
            stroke={theme.colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: [circumference, 0],
            })}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <CustomText style={styles.percentText}>{progress}%</CustomText>
    </View>
  );
};

DownloadAnimation.propTypes = {
  progress: PropTypes.number.isRequired,
  progressAnim: PropTypes.shape({
    interpolate: PropTypes.func.isRequired,
  }).isRequired,
};

export default DownloadAnimation;
