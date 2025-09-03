import React from "react";
import { Text, Pressable, View } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { colors } from "@common";
import { audioControlBarStyles as styles } from "../style";

const ActionComponents = ({ selector, toggle, Icon, text }) => {
  const isNightMode = useSelector((state) => state.isNightMode);

  let color;
  let backgroundColor;

  if (selector) {
    backgroundColor = colors.READER_HEADER_COLOR;
    color = isNightMode ? colors.WHITE_COLOR : colors.AUDIO_PLAYER_NIGHT_ICON;
  } else {
    backgroundColor = isNightMode ? colors.ACTION_BUTTON_NIGHT_MODE : colors.ACTION_BUTTON_COLOR;
    color = colors.READER_HEADER_COLOR;
  }

  return (
    <Pressable
      style={[
        styles.actionButton,
        {
          backgroundColor,
        },
      ]}
      onPress={() => toggle((prev) => !prev)}
    >
      <View style={styles.actionButtonContent}>
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
      </View>
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
