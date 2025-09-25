import React from "react";
import { Text } from "react-native";
import PropTypes from "prop-types";

const CustomText = ({ style, children, numberOfLines, onPress, onLongPress }) => {
  return (
    <Text
      style={style}
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
