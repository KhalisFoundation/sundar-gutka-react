import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, View, Easing } from "react-native";
import { Icon, ListItem } from "@rneui/themed";
import { STRINGS } from "@common";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import PropTypes from "prop-types";
import { checkUpdateStyles } from "./styles";

const CheckUpdatesAnimation = ({ isLoading, isUpdateAvailable }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(checkUpdateStyles);
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
    <View style={styles.mainWrapper}>
      {isLoading && (
        <ListItem containerStyle={styles.mainWrapper}>
          <ListItem.Title style={styles.header}>
            <Text style={{ color: theme.colors.primaryText }}>{STRINGS.checkForUpdate}</Text>
          </ListItem.Title>
          <ListItem.Content>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Icon name="refresh" type="material" size={35} color={theme.colors.primaryText} />
            </Animated.View>
          </ListItem.Content>
        </ListItem>
      )}
      {!isUpdateAvailable && !isLoading && (
        <ListItem containerStyle={styles.mainWrapper}>
          <ListItem.Title style={styles.header}>
            <Text style={{ color: theme.colors.primaryText }}>{STRINGS.upToDate}</Text>
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
