import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View, Text, Button } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "bold",
  },
});

const DownloadAnimation = () => {
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
      <Svg width={120} height={120} viewBox="0 0 120 120">
        {/* Background circle */}
        <Circle cx="60" cy="60" r={radius} stroke="#e6e6e6" strokeWidth={strokeWidth} fill="none" />
        {/* Animated progress circle */}
        <AnimatedCircle
          cx="60"
          cy="60"
          r={radius}
          stroke="blue"
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
      <Text style={styles.text}>{progress}%</Text>
      <Button title="Start Download" onPress={startDownload} disabled={downloading} />
    </View>
  );
};

export default DownloadAnimation;
