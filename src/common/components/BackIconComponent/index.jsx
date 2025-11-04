import React from "react";
import { Pressable } from "react-native";
import PropTypes from "prop-types";
import { BackArrowIcon } from "@common/icons";

const BackIconComponent = ({ size, handleBackPress, color }) => {
  return (
    <Pressable
      onPress={() => {
        handleBackPress();
      }}
    >
      <BackArrowIcon size={size} color={color} />
    </Pressable>
  );
};

BackIconComponent.defaultProps = {
  size: 25,
};
BackIconComponent.propTypes = {
  size: PropTypes.number,
  handleBackPress: PropTypes.func.isRequired,
  color: PropTypes.string.isRequired,
};

export default BackIconComponent;
