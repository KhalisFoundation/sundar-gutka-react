import React, { useEffect, useCallback } from "react";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { constant } from "@common";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
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
      <Icon
        name="arrow-back"
        size={30}
        onPress={handleBackPress}
        color={theme.staticColors.WHITE_COLOR}
      />
    );
  };
  const headerRight = () => {
    return (
      <Icon
        name="settings"
        color={theme.staticColors.WHITE_COLOR}
        size={30}
        onPress={handleSettingsPress}
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
