import React from "react";
import { Pressable, View } from "react-native";
import PropTypes from "prop-types";
import { CustomText } from "@common";
import { audioControlBarStyles } from "../style";
import { useAudioTheme, useAudioThemedStyles } from "../useAudioTheme";

const ActionComponents = ({ selector, toggle, Icon, text }) => {
  const { theme } = useAudioTheme();
  const styles = useAudioThemedStyles(audioControlBarStyles);

  // The Audios / Options pills.
  //
  // Selection is carried by the FILL alone. The icon is always the app blue and
  // the label always the text colour, so neither changes as you toggle — only
  // the tint behind them does.
  //
  // That was the ugly part: a solid blue slab with white text sitting next to a
  // pale one, so the two states read as two different controls rather than one
  // control in two states.
  //
  // No border in either state, matching every other surface in the player.
  // Both states carry a FILL, so the control reads as a pill-shaped button
  // whether or not it is on. Unselected was fully transparent, which left the
  // icon and label floating with nothing to say they were tappable — and gave
  // the pair no shape until one of them happened to be active.
  //
  // Two existing roles, no new colours: the neutral tint for the resting state
  // and the brand tint for the selected one, so the difference between them is
  // still obvious in both themes.
  const backgroundColor = selector ? theme.c.accentSubtle : theme.c.fillSubtle;
  const iconColor = theme.c.textBrand;
  const labelColor = theme.c.textPrimary;

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
        <View style={styles.actionButtonIconContainer}>
          <Icon size={20} color={iconColor} />
        </View>
        <CustomText numberOfLines={2} style={[styles.actionButtonText, { color: labelColor }]}>
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
