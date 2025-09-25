import React, { useEffect, useRef, useState, useMemo } from "react";
import { Animated, View, Easing } from "react-native";
import { Icon, ListItem } from "@rneui/themed";
import { STRINGS, CustomText } from "@common";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { checkUpdateStyles as styles, darkMode } from "./styles";

const CheckUpdatesAnimation = ({ isLoading, isUpdateAvailable }) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [checking, setChecking] = useState(false);
  const animationRef = useRef(null);
  const { darkModeContainer, darkModeText } = useMemo(() => darkMode(isNightMode), [isNightMode]);

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
    const timeoutId = setTimeout(() => {
      setChecking(false);
    }, 3000);
    return () => clearTimeout(timeoutId);
  };
  useEffect(() => {
    handleCheckUpdates();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.mainWrapper, darkModeContainer]}>
      {isLoading && (
        <ListItem containerStyle={darkModeContainer}>
          <ListItem.Title style={styles.header}>
            <CustomText style={darkModeText}>{STRINGS.checkForUpdate}</CustomText>
          </ListItem.Title>
          <ListItem.Content>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Icon
                name="refresh"
                type="material"
                size={35}
                color={isNightMode ? "white" : "black"}
              />
            </Animated.View>
          </ListItem.Content>
        </ListItem>
      )}
      {!isUpdateAvailable && !isLoading && (
        <ListItem containerStyle={darkModeContainer}>
          <ListItem.Title style={[styles.header, darkModeContainer]}>
            <CustomText style={darkModeText}>{STRINGS.upToDate}</CustomText>
          </ListItem.Title>
        </ListItem>
      )}
    </View>
  );
};
CheckUpdatesAnimation.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  isUpdateAvailable: PropTypes.bool.isRequired,
};

export default CheckUpdatesAnimation;
