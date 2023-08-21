import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon } from "@rneui/themed";
import { useDispatch, useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import styles from "../styles/styles";
import { setPadched, PADCHED_SETTINGS } from "../../common/actions";
import colors from "../../common/colors";

const renderItem = (item, dispatch, isNightMode, padched, toggleVisible) => {
  return (
    <ListItem
      key={item.key}
      bottomDivider
      containerStyle={[
        { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
      ]}
      onPress={() => {
        toggleVisible(false);
        dispatch(setPadched(item.key));
      }}
    >
      <ListItem.Content>
        <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
          {item.title}
        </ListItem.Title>
      </ListItem.Content>
      {padched === item.key && <Icon color={isNightMode && colors.WHITE_COLOR} name="check" />}
    </ListItem>
  );
};

function PadchedSettingsComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const { padched, isNightMode } = useSelector((state) => state);
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
        <Avatar source={require("../../../images/larivaaricon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.padchhed_settings}
          </ListItem.Title>
        </ListItem.Content>
        {padched && (
          <ListItem.Title
            style={[styles.titleInfoStyle, { color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}
          >
            {PADCHED_SETTINGS.filter((item) => item.key === padched).map((item) => item.title)[0]}
          </ListItem.Title>
        )}
        <ListItem.Chevron />
      </ListItem>
      {isVisible && (
        <BottomSheet modalProps={{}} isVisible>
          <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.padchhed_settings}
          </Text>
          {PADCHED_SETTINGS.map((item) =>
            renderItem(item, dispatch, isNightMode, padched, toggleVisible)
          )}
        </BottomSheet>
      )}
    </>
  );
}

export default PadchedSettingsComponent;
