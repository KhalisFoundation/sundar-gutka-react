import React, { useCallback } from "react";
import { Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";
import { BackArrowIcon } from "@common/icons";
import STRINGS from "@common/localization";

// Icon-only, so it must announce itself: it previously carried no
// `accessibilityRole` and no label, leaving a screen reader with nothing to say
// for the back control on every screen that used it. `hitSlop` lifts the touch
// area to the 44pt floor without changing how the arrow looks.
const BackIconComponent = ({
  size = 25,
  color,
  onPress = null,
  accessibilityLabel = undefined,
}) => {
  const navigation = useNavigation();

  const handleBackPress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    navigation.goBack();
  }, [onPress, navigation]);

  return (
    <Pressable
      onPress={handleBackPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? STRINGS.GO_BACK}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <BackArrowIcon size={size} color={color} />
    </Pressable>
  );
};

BackIconComponent.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  accessibilityLabel: PropTypes.string,
};

export default BackIconComponent;
