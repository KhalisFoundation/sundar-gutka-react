import React, { useState } from "react";
import { Text, Appearance } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import STRINGS from "../../common/localization";
import styles from "../styles";
import { setTheme, THEMES, toggleNightMode } from "../../common/actions";
import colors from "../../common/colors";
import constant from "../../common/constant";

const handleTheme = (value, dispatch, toggleVisible) => {
  toggleVisible(false);
  dispatch(setTheme(value));
  const colorScheme = Appearance.getColorScheme();
  switch (value) {
    case constant.Light:
      dispatch(toggleNightMode(false));
      break;
    case constant.Dark:
      dispatch(toggleNightMode(true));
      break;
    default:
      dispatch(toggleNightMode(colorScheme !== constant.Light.toLowerCase()));
  }
};

const renderItem = (item, dispatch, isNightMode, theme, toggleVisible) => {
  return (
    <ListItem
      key={item}
      bottomDivider
      containerStyle={[
        { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
      ]}
      onPress={() => {
        handleTheme(item, dispatch, toggleVisible);
      }}
    >
      <ListItem.Content>
        <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
          {item}
        </ListItem.Title>
      </ListItem.Content>
      {theme === item && <Icon color={isNightMode && colors.WHITE_COLOR} name="check" />}
    </ListItem>
  );
};

function ThemeComponent({ isNightMode, dispatch }) {
  const [isVisible, toggleVisible] = useState(false);
  const { theme } = useSelector((state) => state);

  return (
    <>
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
        onPress={() => {
          toggleVisible(true);
        }}
      >
        <Avatar source={require("../../../images/bgcoloricon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.theme}
          </ListItem.Title>
        </ListItem.Content>
        {theme && (
          <ListItem.Title
            style={[styles.titleInfoStyle, { color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}
          >
            {theme}
          </ListItem.Title>
        )}
        <ListItem.Chevron />
      </ListItem>
      {isVisible && (
        <BottomSheet modalProps={{}} isVisible>
          <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.theme}
          </Text>
          {THEMES.map((item) => renderItem(item, dispatch, isNightMode, theme, toggleVisible))}
        </BottomSheet>
      )}
    </>
  );
}
ThemeComponent.propTypes = {
  isNightMode: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
};
export default ThemeComponent;
