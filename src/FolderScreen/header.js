import React, { useEffect, useCallback } from "react";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { colors, constant } from "@common";
import getHeaderStyles from "./styles";

const Header = ({ navigation, title }) => {
  const { headerStyle, headerTitleStyle } = getHeaderStyles();
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
      headerTitleStyle,
      headerStyle,
      headerLeft,
      headerRight,
    });
  }, [handleBackPress, handleSettingsPress]);

  return null;
};

Header.propTypes = {
  navigation: PropTypes.shape().isRequired,
  title: PropTypes.string.isRequired,
};
export default Header;
