import React from "react";
import { Pressable } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import STRINGS from "@common/localization";

// The Home header's left slot, built like SettingsIconComponent on the right so the
// two controls share size, hit area and press feedback. IconAction's size is the
// sheet title-row token (22), smaller than the header gear (26).
const KidsIcon = ({ size = 26, color, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={STRINGS.KIDS_MODE}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
  >
    <Icon name="account-child-outline" type="material-community" size={size} color={color} />
  </Pressable>
);

KidsIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default KidsIcon;
