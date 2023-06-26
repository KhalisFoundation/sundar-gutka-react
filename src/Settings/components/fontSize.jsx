import React from "react";
import { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon } from "@rneui/themed";
import STRINGS from "../../common/localization";
import styles from "../styles";
import { setFontSize, FONT_SIZES } from "../../common/actions";
import { useSelector } from "react-redux";
import colors from "../../common/colors";

function FontSizeComponent({ isNightMode, dispatch }) {
  const [isVisible, toggleVisible] = useState(false);
  const { fontSize } = useSelector((state) => state);

  const renderItem = (item, dispatch) => {
    return (
      <ListItem
        key={item.key}
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
        onPress={() => {
          toggleVisible(false);
          dispatch(setFontSize(item.key));
        }}
      >
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {item.title}
          </ListItem.Title>
        </ListItem.Content>
        {fontSize === item.key && <Icon color={isNightMode && colors.WHITE_COLOR} name="check" />}
      </ListItem>
    );
  };
  const BottomSheetContent = () => (
    <BottomSheet modalProps={{}} isVisible>
      <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
        {STRINGS.font_size}
      </Text>
      {FONT_SIZES.map((item) => renderItem(item, dispatch))}
    </BottomSheet>
  );

  const TriggerComponent = () => {
    return (
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
        onPress={() => {
          toggleVisible(true);
        }}
      >
        <Avatar source={require("../../../images/fontsizeicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.font_size}
          </ListItem.Title>
        </ListItem.Content>
        {fontSize && (
          <ListItem.Title
            style={[styles.titleInfoStyle, { color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}
          >
            {FONT_SIZES.filter((item) => item.key === fontSize).map((item) => item.title)[0]}
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
export default FontSizeComponent;
