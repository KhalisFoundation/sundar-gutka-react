import React from "react";
import { ListItem, Avatar, Icon, Switch } from "@rneui/themed";
import { useDispatch, useSelector } from "react-redux";
import { STRINGS } from "../../common";
import { toggleLarivaar, toggleLarivaarAssist } from "../../common/actions";
import { nightModeStyles, iconNightColor } from "../styles";

function LarivaarComponent() {
  const isNightMode = useSelector((state) => state.isNightMode);
  const isLarivaar = useSelector((state) => state.isLarivaar);
  const isLarivaarAssist = useSelector((state) => state.isLarivaarAssist);

  const dispatch = useDispatch();
  const { containerNightStyles, textNightStyle } = nightModeStyles(isNightMode);
  const iconColor = iconNightColor(isNightMode);
  const larivaarIcon = require("../../../images/larivaaricon.png");
  return (
    <>
      <ListItem bottomDivider containerStyle={containerNightStyles}>
        <Avatar source={larivaarIcon} />
        <ListItem.Content>
          <ListItem.Title style={textNightStyle}>{STRINGS.larivaar}</ListItem.Title>
        </ListItem.Content>
        <Switch value={isLarivaar} onValueChange={(value) => dispatch(toggleLarivaar(value))} />
      </ListItem>
      {isLarivaar && (
        <ListItem bottomDivider containerStyle={containerNightStyles}>
          <Icon name="opacity" size={30} color={iconColor} />
          <ListItem.Content>
            <ListItem.Title style={textNightStyle}>{STRINGS.larivaar_assist}</ListItem.Title>
          </ListItem.Content>
          <Switch
            value={isLarivaarAssist}
            onValueChange={(value) => dispatch(toggleLarivaarAssist(value))}
          />
        </ListItem>
      )}
    </>
  );
}

export default LarivaarComponent;
