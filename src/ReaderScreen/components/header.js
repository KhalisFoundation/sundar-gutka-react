import React, { useEffect } from "react";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import colors from "../../common/colors";
import constant from "../../common/constant";

function Header({ navigation, title, handleBackPress, handleBookmarkPress, handleSettingsPress }) {
  const { isNightMode } = useSelector((state) => state);
  const headerLeft = () => {
    return (
      <Icon name="arrow-back" size={30} onPress={handleBackPress} color={colors.WHITE_COLOR} />
    );
  };
  const headerRight = () => {
    return (
      <>
        <Icon name="bookmark" color={colors.TOOLBAR_TINT} size={30} onPress={handleBookmarkPress} />
        <Icon name="settings" color={colors.TOOLBAR_TINT} size={30} onPress={handleSettingsPress} />
      </>
    );
  };

  useEffect(() => {
    navigation.setOptions({
      title,
      headerTitleStyle: {
        color: colors.WHITE_COLOR,
        fontWeight: "normal",
        fontFamily: constant.GURBANI_AKHAR_TRUE,
        fontSize: 20,
      },
      headerStyle: {
        backgroundColor: !isNightMode
          ? colors.READER_STATUS_BAR_COLOR
          : colors.READER_STATUS_BAR_COLOR_NIGHT_MODE,
      },
      headerLeft,
      headerRight,
    });
  }, [handleBackPress, handleBookmarkPress, handleSettingsPress]);

  return null;
}

Header.propTypes = {
  navigation: PropTypes.shape().isRequired,
  title: PropTypes.string.isRequired,
  handleBackPress: PropTypes.func.isRequired,
  handleBookmarkPress: PropTypes.func.isRequired,
  handleSettingsPress: PropTypes.func.isRequired,
};
export default Header;
