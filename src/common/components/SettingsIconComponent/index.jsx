import React from "react";
import { Pressable } from "react-native";
import PropTypes from "prop-types";
import { SettingsIcon } from "@common/icons";
import STRINGS from "@common/localization";

// Icon-only, so it must announce itself. `hitSlop` lifts the touch area to the
// 44pt floor without changing the icon's size.
const SettingsIconComponent = ({ size = 25, handleSettingsPress, color }) => (
  <Pressable
    onPress={handleSettingsPress}
    accessibilityRole="button"
    accessibilityLabel={STRINGS.SETTINGS}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
  >
    <SettingsIcon size={size} color={color} />
  </Pressable>
);

SettingsIconComponent.propTypes = {
  size: PropTypes.number,
  handleSettingsPress: PropTypes.func.isRequired,
  color: PropTypes.string.isRequired,
};

export default SettingsIconComponent;
