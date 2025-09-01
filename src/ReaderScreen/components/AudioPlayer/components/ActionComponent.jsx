import React from "react";
import { Text, Pressable } from "react-native";
import { useSelector } from "react-redux";
import { colors } from "@common";
import PropTypes from "prop-types";
import { audioControlBarStyles as styles } from "../style";

const ActionComponents = ({ selector, toggle, Icon, text }) => {
  const isNightMode = useSelector((state) => state.isNightMode);

  let color = colors.READER_HEADER_COLOR;
  if (selector) {
    color = colors.READER_HEADER_COLOR;
    if (isNightMode) {
      color = colors.WHITE_COLOR;
    } else {
      color = colors.AUDIO_PLAYER_NIGHT_ICON;
    }
  }

  return (
    <Pressable
      style={[
        styles.actionButton,
        {
          backgroundColor: isNightMode
            ? colors.ACTION_BUTTON_NIGHT_MODE
            : colors.ACTION_BUTTON_COLOR,
        },
        {
          backgroundColor: selector ? colors.READER_HEADER_COLOR : colors.ACTION_BUTTON_COLOR,
        },
      ]}
      onPress={() => toggle((prev) => !prev)}
    >
      <Icon size={25} color={color} />
      <Text
        style={[
          styles.actionButtonText,
          {
            color,
          },
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
};

ActionComponents.propTypes = {
  selector: PropTypes.string.isRequired,
  toggle: PropTypes.func.isRequired,
  Icon: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
};

export default ActionComponents;
