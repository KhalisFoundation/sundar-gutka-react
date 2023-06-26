import React from "react";
import { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon, Switch } from "@rneui/themed";
import STRINGS from "../../common/localization";
import { toggleLarivaar, toggleLarivaarAssist } from "../../common/actions";
import { useSelector } from "react-redux";
import colors from "../../common/colors";
import styles from "../styles";

function LarivaarComponent({ isNightMode, dispatch }) {
  const { isLarivaar, isLarivaarAssist } = useSelector((state) => state);

  const LarivaarAssist = () => (
    <ListItem bottomDivider>
      <Icon name="opacity" size={30} />
      <ListItem.Content>
        <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
          {STRINGS.larivaar_assist}
        </ListItem.Title>
      </ListItem.Content>
      <Switch
        value={isLarivaarAssist}
        onValueChange={(value) => dispatch(toggleLarivaarAssist(value))}
      />
    </ListItem>
  );

  const TriggerComponent = () => {
    return (
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Avatar source={require("../../../images/larivaaricon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.larivaar}
          </ListItem.Title>
        </ListItem.Content>
        <Switch value={isLarivaar} onValueChange={(value) => dispatch(toggleLarivaar(value))} />
      </ListItem>
    );
  };
  return (
    <>
      <TriggerComponent />
      {isLarivaar && <LarivaarAssist />}
    </>
  );
}
export default LarivaarComponent;
