import React from "react";
import PropTypes from "prop-types";
import { Text, View, Animated } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { colors } from "@common";
import styles from "../styles";
import { darkMode } from "./styles";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DownloadAnimation = ({ progress, progressAnim }) => {
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const { darkModeText } = darkMode();
  return (
    <View style={styles.progressContainer}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        {/* Rotate the group, not individual circles */}
        <G rotation="-90" origin="60, 60">
          <Circle
            cx="60"
            cy="60"
            r={radius}
            stroke={colors.ANIMATION_STROKE_LIGHT}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx="60"
            cy="60"
            r={radius}
            stroke={colors.ANIMATION_STROKE_ACTIVE}
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
      <Text style={[styles.percentText, darkModeText]}>{progress}%</Text>
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
