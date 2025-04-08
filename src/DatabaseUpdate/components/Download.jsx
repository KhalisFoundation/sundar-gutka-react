import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View, Text, Button } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { constant } from "@common";
import { downloadStyles as styles } from "./styles";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DownloadComponent = () => {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;

  // Listener to update progress text from animated value
  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      setProgress(Math.floor(value));
    });
    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [progressAnim]);

  const startDownload = () => {
    // Reset the animated value and progress state
    progressAnim.setValue(0);
    setProgress(0);
    setDownloading(true);

    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 5000, // 5 seconds duration
      easing: Easing.linear,
      useNativeDriver: false, // Must be false for non-layout properties like strokeDashoffset
    }).start(() => {
      setDownloading(false);
    });
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        <Text>{constant.NEW_VERSION_AVAILABLE}</Text>
      </View>

      {/* SVG Circle for progress */}
      <Svg width={120} height={120} viewBox="0 0 120 120">
        {/* Background circle */}
        <Circle cx="60" cy="60" r={radius} stroke="#e6e6e6" strokeWidth={strokeWidth} fill="none" />
        {/* Animated progress circle */}
        <AnimatedCircle
          cx="60"
          cy="60"
          r={radius}
          stroke="#3498db"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progressAnim.interpolate({
            inputRange: [0, 100],
            outputRange: [circumference, 0],
          })}
          strokeLinecap="round"
        />
      </Svg>
      <Button title="Start Download" onPress={startDownload} disabled={downloading} />
      <Text style={styles.text}>{progress}%</Text>
    </View>
  );
};

export default DownloadComponent;
