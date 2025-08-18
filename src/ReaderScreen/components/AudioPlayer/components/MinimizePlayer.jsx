import React from "react";
import { View, Text, Pressable } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Svg, { Circle } from "react-native-svg";
import PropTypes from "prop-types";
import { minimizePlayerStyles as styles } from "../style";

const MinimizePlayer = ({
  setIsMinimized,
  handlePlayPause,
  isPlaying,
  progress,
  duration,
  displayName,
}) => {
  // Convert time string to seconds (e.g., "0:10" -> 10, "1:30" -> 90)
  const timeToSeconds = (timeStr) => {
    if (!timeStr || typeof timeStr !== "string") {
      return 0;
    }
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      const result = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      return result;
    }
    if (parts.length === 1) {
      const result = parseInt(parts[0], 10);
      return result;
    }
    return 0;
  };

  // Convert duration string to seconds
  const durationSeconds = timeToSeconds(duration);
  const progressSeconds = timeToSeconds(progress);

  // Calculate progress for the circle (0 to 1)
  const progressValue =
    durationSeconds > 0 ? Math.min(Math.max(progressSeconds / durationSeconds, 0), 1) : 0;

  // Circle dimensions
  const size = 40;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dasharray for progress
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - progressValue * circumference;

  return (
    <View style={styles.container}>
      <Pressable style={styles.progressContainer} onPress={handlePlayPause}>
        {/* SVG Progress Circle */}
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f0f0f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#113979"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Play/Pause Icon */}
        <View style={styles.playPauseButton}>
          <Icon name={isPlaying ? "pause" : "play-arrow"} size={24} color="#113979" />
        </View>
      </Pressable>

      <Pressable style={styles.textContainer} onPress={() => setIsMinimized(false)}>
        <Text style={styles.timestamp}>{progress}</Text>
        <Text style={styles.artistName}>{displayName}</Text>
      </Pressable>
    </View>
  );
};

MinimizePlayer.propTypes = {
  setIsMinimized: PropTypes.func.isRequired,
  handlePlayPause: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  progress: PropTypes.string.isRequired,
  duration: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
};

export default MinimizePlayer;
