import React from "react";
import { Text } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";

const CustomText = ({ style, children, numberOfLines, onPress, onLongPress }) => {
  const { theme } = useTheme();
  const textStyle = Array.isArray(style)
    ? [{ fontFamily: theme.typography.fonts.balooPaaji }, ...style]
    : [{ fontFamily: theme.typography.fonts.balooPaaji }, style];

  return (
    <Text
      style={textStyle}
      allowFontScaling={false}
      numberOfLines={numberOfLines}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {children}
    </Text>
  );
};

CustomText.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  children: PropTypes.node,
  numberOfLines: PropTypes.number,
  onPress: PropTypes.func,
  onLongPress: PropTypes.func,
};

CustomText.defaultProps = {
  style: null,
  children: null,
  numberOfLines: null,
  onPress: null,
  onLongPress: null,
};

export default CustomText;
