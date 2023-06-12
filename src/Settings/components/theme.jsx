import React from "react";
import { useState } from "react";
import { Text, Appearance } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon } from "@rneui/themed";
import STRINGS from "../../common/localization";
import styles from "../styles";
import { setTheme, THEMES, toggleNightMode } from "../../common/actions";
import { useSelector } from "react-redux";
import colors from "../../common/colors";
import constant from "../../common/constant";

function ThemeComponent({ isNightMode, dispatch }) {
  const [isVisible, toggleVisible] = useState(false);
  const { theme } = useSelector((state) => state);

  const toggleIsNightMode = (value) => {
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
        const bool = colorScheme !== constant.Light.toLowerCase();
        dispatch(toggleNightMode(bool));
    }
  };
  const renderItem = (item, dispatch) => {
    return (
      <ListItem
        key={item}
        bottomDivider
        onPress={() => {
          toggleIsNightMode(item);
        }}
      >
        <ListItem.Content>
          <ListItem.Title>{item}</ListItem.Title>
        </ListItem.Content>
        {theme === item && <Icon name="check" />}
      </ListItem>
    );
  };
  const BottomSheetContent = () => (
    <BottomSheet modalProps={{}} isVisible>
      <Text style={styles.bottomSheetTitle}>{STRINGS.theme}</Text>
      {THEMES.map((item) => renderItem(item, dispatch))}
    </BottomSheet>
  );

  const TriggerComponent = () => {
    return (
      <ListItem
        bottomDivider
        containerStyle={[{ backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : null }]}
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
    );
  };
  return (
    <>
      <TriggerComponent />
      {isVisible && <BottomSheetContent />}
    </>
  );
}
export default ThemeComponent;
