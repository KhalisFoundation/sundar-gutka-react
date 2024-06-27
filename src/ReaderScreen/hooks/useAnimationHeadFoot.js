import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Animated } from "react-native";

function useAnimationHeadFoot() {
  const isHeaderFooter = useSelector((state) => state.isHeaderFooter);
  const [animationPosition] = useState(new Animated.Value(0));
  useEffect(() => {
    const value = isHeaderFooter ? 0 : 130;
    Animated.timing(animationPosition, {
      toValue: value,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isHeaderFooter]);
  return animationPosition;
}
export default useAnimationHeadFoot;
