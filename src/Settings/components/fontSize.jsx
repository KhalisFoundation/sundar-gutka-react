import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import STRINGS from "../../common/localization";
import styles from "../styles/styles";
import { setFontSize, FONT_SIZES } from "../../common/actions";
import colors from "../../common/colors";

const renderItem = (item, dispatch, isNightMode, toggleVisible, fontSize) => {
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

function FontSizeComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const { fontSize, isNightMode } = useSelector((state) => state);
  const dispatch = useDispatch();

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
      {isVisible && (
        <BottomSheet modalProps={{}} isVisible>
          <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.font_size}
          </Text>
          {FONT_SIZES.map((item) =>
            renderItem(item, dispatch, isNightMode, toggleVisible, fontSize)
          )}
        </BottomSheet>
      )}
    </>
  );
}

export default FontSizeComponent;
