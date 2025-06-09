import React from "react";
import { View, Text, useCallback } from "react-native";
import { Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { colors, STRINGS, StatusBarComponent } from "@common";
import styles from "./styles";

const Header = ({ navigation, setReset }) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const { goBack } = navigation;
  const { WHITE_COLOR, NIGHT_BLACK, TOOLBAR_COLOR_ALT2, TOOLBAR_COLOR_ALT } = colors;
  const { EDIT_BANI_ORDER } = STRINGS;

  const headerStyles = {
    backgroundColor: isNightMode ? TOOLBAR_COLOR_ALT2 : TOOLBAR_COLOR_ALT,
    textColor: isNightMode ? WHITE_COLOR : NIGHT_BLACK,
  };

  const headerLeft = useCallback(
    () => (
      <Icon
        name="arrow-back"
        size={30}
        onPress={() => goBack()}
        color={headerStyles.textColor}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      />
    ),
    [headerStyles.textColor]
  );

  const headerRight = useCallback(
    () => (
      <Icon
        name="refresh"
        size={30}
        onPress={() => setReset(true)}
        color={headerStyles.textColor}
        accessibilityLabel="Reset bani order"
        accessibilityRole="button"
      />
    ),
    [headerStyles.textColor]
  );

  return (
    <>
      <StatusBarComponent backgroundColor={headerStyles.backgroundColor} />
      <View style={[styles.container, { backgroundColor: headerStyles.backgroundColor }]}>
        <View style={styles.leftContainer}>{headerLeft()}</View>
        <Text style={[styles.title, { color: headerStyles.textColor }]}>{EDIT_BANI_ORDER}</Text>
        <View style={styles.rightContainer}>{headerRight()}</View>
      </View>
    </>
  );
};

Header.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  setReset: PropTypes.func.isRequired,
};

export default Header;
