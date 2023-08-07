import React, { useEffect, useCallback } from "react";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import colors from "../common/colors";
import getHeaderStyles from "./styles";
import constant from "../common/constant";

function Header({ navigation, title }) {
  const { isNightMode } = useSelector((state) => state);
  const styles = getHeaderStyles(isNightMode);
  const handleBackPress = useCallback(() => navigation.goBack(), [navigation]);
  const handleSettingsPress = useCallback(
    () => navigation.navigate(constant.SETTINGS),
    [navigation]
  );
  const headerLeft = () => {
    return (
      <Icon name="arrow-back" size={30} onPress={handleBackPress} color={colors.WHITE_COLOR} />
    );
  };
  const headerRight = () => {
    return (
      <Icon name="settings" color={colors.TOOLBAR_TINT} size={30} onPress={handleSettingsPress} />
    );
  };

  useEffect(() => {
    navigation.setOptions({
      title,
      headerTitleStyle: styles.headerTitleStyle,
      headerStyle: styles.headerStyle,
      headerLeft,
      headerRight,
    });
  }, [handleBackPress, handleSettingsPress]);

  return null;
}

Header.propTypes = {
  navigation: PropTypes.shape().isRequired,
  title: PropTypes.string.isRequired,
};
export default Header;
