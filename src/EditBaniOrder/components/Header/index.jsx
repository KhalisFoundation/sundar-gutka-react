import React, { useCallback } from "react";
import { View, Text } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { STRINGS } from "@common";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "./styles";

const Header = ({ navigation, setReset }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { goBack } = navigation;
  const { EDIT_BANI_ORDER } = STRINGS;

  const headerLeft = useCallback(
    () => (
      <Icon
        name="arrow-back"
        size={30}
        onPress={() => goBack()}
        color={theme.staticColors.WHITE_COLOR}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      />
    ),
    [goBack, theme.staticColors.WHITE_COLOR]
  );

  const headerRight = useCallback(
    () => (
      <Icon
        name="refresh"
        size={30}
        onPress={() => setReset(true)}
        color={theme.staticColors.WHITE_COLOR}
        accessibilityLabel="Reset bani order"
        accessibilityRole="button"
      />
    ),
    [setReset, theme.staticColors.WHITE_COLOR]
  );

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>{headerLeft()}</View>
      <Text style={styles.title}>{EDIT_BANI_ORDER}</Text>
      <View style={styles.rightContainer}>{headerRight()}</View>
    </View>
  );
};

Header.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  setReset: PropTypes.func.isRequired,
};

export default Header;
