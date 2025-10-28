import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PropTypes from "prop-types";
import { constant } from "@common";

const SafeArea = ({ children, backgroundColor, topPadding = false }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom <= constant.MINIMUM_BOTTOM_PADDING ? 0 : insets.bottom;
  const top = topPadding ? insets.top : 0;

  return (
    <View style={[{ backgroundColor, flex: 1, paddingBottom: bottomPadding, paddingTop: top }]}>
      {children}
    </View>
  );
};

SafeArea.propTypes = {
  children: PropTypes.node.isRequired,
  backgroundColor: PropTypes.string.isRequired,
  topPadding: PropTypes.bool,
};

SafeArea.defaultProps = {
  topPadding: false,
};

export default SafeArea;
