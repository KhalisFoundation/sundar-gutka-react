import { useEffect, useRef } from "react";
import { Animated, Easing, useWindowDimensions } from "react-native";

/**
 * How much of the window the expanded panel — the inline Audios list and the
 * audio Options — may take.
 *
 * It was a flat 300pt, which is a different fraction of every device and no
 * fraction at all of the text size. At a raised OS text size the "Select a
 * track" heading and one row already exceed it, and `overflow: hidden` on the
 * panel simply cut off whatever did not fit.
 */
const PANEL_WINDOW_SHARE = 0.42;
const PANEL_MIN = 200;
const PANEL_MAX = 380;

const useAnimation = (isSettingsModalOpen, isMoreTracksModalOpen, isMinimized) => {
  const { height } = useWindowDimensions();
  const openHeight = Math.round(
    Math.min(PANEL_MAX, Math.max(PANEL_MIN, height * PANEL_WINDOW_SHARE))
  );
  const modalHeight = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const playerOpacity = useRef(new Animated.Value(1)).current;
  const minimizeOpacity = useRef(new Animated.Value(0)).current;

  // Animate modal open/close
  useEffect(() => {
    const shouldShow = isSettingsModalOpen || isMoreTracksModalOpen;

    Animated.parallel([
      Animated.timing(modalHeight, {
        toValue: shouldShow ? openHeight : 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // maxHeight requires useNativeDriver: false
      }),
      Animated.timing(modalOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false, // Keep consistent with height animation
      }),
    ]).start();
  }, [isSettingsModalOpen, isMoreTracksModalOpen, modalHeight, modalOpacity, openHeight]);

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
