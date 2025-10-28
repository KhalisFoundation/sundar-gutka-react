import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

const useAnimation = (isSettingsModalOpen, isMoreTracksModalOpen, isMinimized) => {
  const modalHeight = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const playerOpacity = useRef(new Animated.Value(1)).current;
  const minimizeOpacity = useRef(new Animated.Value(0)).current;

  // Animate modal open/close
  useEffect(() => {
    const shouldShow = isSettingsModalOpen || isMoreTracksModalOpen;

    Animated.parallel([
      Animated.timing(modalHeight, {
        toValue: shouldShow ? 200 : 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // Height requires useNativeDriver: false
      }),
      Animated.timing(modalOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false, // Keep consistent with height animation
      }),
    ]).start();
  }, [isSettingsModalOpen, isMoreTracksModalOpen, modalHeight, modalOpacity]);

  // Animate minimize/maximize player
  useEffect(() => {
    if (isMinimized) {
      // Fade out full player, fade in minimized player
      Animated.parallel([
        Animated.timing(playerOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(minimizeOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Fade in full player, fade out minimized player
      Animated.parallel([
        Animated.timing(playerOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(minimizeOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isMinimized, playerOpacity, minimizeOpacity]);

  return { modalHeight, modalOpacity, playerOpacity, minimizeOpacity };
};

export default useAnimation;
