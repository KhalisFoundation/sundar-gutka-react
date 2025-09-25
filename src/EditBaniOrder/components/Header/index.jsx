import React, { useCallback } from "react";
import { View } from "react-native";
import { Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { STRINGS, CustomText } from "@common";
import styles from "./styles";
import { nightStyles } from "../../styles";

const Header = ({ navigation, setReset }) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const { goBack } = navigation;
  const { EDIT_BANI_ORDER } = STRINGS;
  const { headerStyles } = nightStyles(isNightMode);

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
    [goBack, headerStyles.textColor]
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
    [setReset, headerStyles.textColor]
  );

  return (
    <View style={[styles.container, { backgroundColor: headerStyles.backgroundColor }]}>
      <View style={styles.leftContainer}>{headerLeft()}</View>
      <CustomText style={[styles.title, { color: headerStyles.textColor }]}>
        {EDIT_BANI_ORDER}
      </CustomText>
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
