import React from "react";
import { Linking } from "react-native";
import { ListItem, Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import { STRINGS } from "@common";
import { iconNightColor, nightModeStyles, nightModeColor } from "../styles/nightModeStyles";

function Donate() {
  const isNightMode = useSelector((state) => state.isNightMode);
  const iconColor = iconNightColor(isNightMode);
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { donate } = STRINGS;
  return (
    <ListItem
      bottomDivider
      containerStyle={containerNightStyles}
      onPress={() => Linking.openURL("https://khalisfoundation.org/donate/")}
    >
      <Icon color={iconColor} name="volunteer-activism" size={30} />
      <ListItem.Content>
        <ListItem.Title style={nightColor}>{donate}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
}
export default Donate;
