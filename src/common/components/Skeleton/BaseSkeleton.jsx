import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";

const BaseSkeleton = ({ width, height, borderRadius, style }) => {
  const { theme } = useTheme();
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [pulse]);

  const defaultRadius = theme.radius?.md ?? 12;

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius ?? defaultRadius,
          backgroundColor: theme.colors.separator,
          overflow: "hidden",
          opacity: pulse,
        },
        style,
      ]}
    />
  );
};

BaseSkeleton.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.number,
  borderRadius: PropTypes.number,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

BaseSkeleton.defaultProps = {
  width: "100%",
  height: 16,
  borderRadius: null,
  style: null,
};

export default BaseSkeleton;
