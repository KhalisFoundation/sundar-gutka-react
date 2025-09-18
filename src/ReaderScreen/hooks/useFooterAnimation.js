import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";

const useFooterAnimation = (isHeader) => {
  const [animationPosition] = useState(new Animated.Value(0));
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  // Handle animation
  useEffect(() => {
    const value = isHeader ? 0 : 420;
    if (animationRef.current) {
      animationRef.current.stop();
    }
    animationRef.current = Animated.timing(animationPosition, {
      toValue: value,
      duration: 500,
      useNativeDriver: true,
    });
    animationRef.current.start();
  }, [isHeader]);

  return { animationPosition };
};

export default useFooterAnimation;
