import React, { useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { BackIconComponent, SettingsIconComponent } from "@common/components";
import { constant, useTheme, useThemedStyles } from "@common";
import getHeaderStyles from "./styles";

const Header = ({ navigation, title }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(getHeaderStyles);
  const handleBackPress = useCallback(() => navigation.goBack(), [navigation]);
  const handleSettingsPress = useCallback(
    () => navigation.navigate(constant.SETTINGS),
    [navigation]
  );
  const headerLeft = () => {
    return (
      <BackIconComponent
        size={30}
        handleBackPress={handleBackPress}
        color={theme.staticColors.WHITE_COLOR}
      />
    );
  };
  const headerRight = () => {
    return (
      <SettingsIconComponent
        handleSettingsPress={handleSettingsPress}
        color={theme.staticColors.WHITE_COLOR}
        size={30}
      />
    );
  };

  useEffect(() => {
    navigation.setOptions({
      title,
      headerTitleStyle: styles.headerTitleStyle,
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
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
