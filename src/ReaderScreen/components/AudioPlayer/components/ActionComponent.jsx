import React from "react";
import { Pressable, View } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { CustomText } from "@common";
import { audioControlBarStyles } from "../style";

const ActionComponents = ({ selector, toggle, Icon, text }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(audioControlBarStyles);

  let color;
  let backgroundColor;

  if (selector) {
    backgroundColor = theme.colors.primary;
    color = theme.staticColors.WHITE_COLOR;
  } else {
    backgroundColor = theme.colors.actionButton;
    color = theme.colors.audioTitleText;
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
        <CustomText
          style={[
            styles.actionButtonText,
            {
              color,
            },
          ]}
        >
          {text}
        </CustomText>
      </View>
    </Pressable>
  );
};

ActionComponents.propTypes = {
  selector: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  Icon: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
};

export default ActionComponents;
