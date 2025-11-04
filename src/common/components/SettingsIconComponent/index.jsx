import React from "react";
import { Pressable } from "react-native";
import PropTypes from "prop-types";
import { SettingsIcon } from "@common/icons";

const SettingsIconComponent = ({ size, handleSettingsPress, color }) => {
  return (
    <Pressable
      onPress={() => {
        handleSettingsPress();
      }}
    >
      <SettingsIcon size={size} color={color} />
    </Pressable>
  );
};

SettingsIconComponent.defaultProps = {
  size: 25,
};
SettingsIconComponent.propTypes = {
  size: PropTypes.number,
  handleSettingsPress: PropTypes.func.isRequired,
  color: PropTypes.string.isRequired,
};

export default SettingsIconComponent;
