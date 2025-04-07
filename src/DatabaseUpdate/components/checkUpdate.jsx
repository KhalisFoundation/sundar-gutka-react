import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, StyleSheet, View, Easing } from "react-native"; // Importing SVG components
import { Icon, ListItem } from "@rneui/themed";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 20,
    marginBottom: 5,
  },
  status: {
    marginTop: 20,
    fontSize: 18,
  },
});

const CheckUpdatesAnimation = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [checking, setChecking] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    if (checking) {
      // Reset the animated value to 0 before starting
      rotateAnim.setValue(0);
      animationRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animationRef.current.start();
    } else if (animationRef.current) {
      animationRef.current.stop();
      rotateAnim.setValue(0); // Reset after stopping
    }

    // Clean up on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [checking, rotateAnim]);

  const handleCheckUpdates = () => {
    setChecking(true);
    // Simulate an update check with a timeout of 3 seconds
    setTimeout(() => {
      setChecking(false);
    }, 3000);
  };
  useEffect(() => {
    handleCheckUpdates();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={{ marginBottom: 10 }}>
      <ListItem>
        <ListItem.Title style={styles.header}>
          <Text>Check for Updates</Text>
        </ListItem.Title>
        <ListItem.Content>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Icon name="refresh" type="material" size={35} color="black" />
          </Animated.View>
        </ListItem.Content>
      </ListItem>
    </View>
  );
};

export default CheckUpdatesAnimation;
