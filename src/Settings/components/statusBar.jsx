import React from "react";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { toggleStatusBar } from "@common/actions";
import STRINGS from "@common/localization";
import { iconNightColor, nightModeStyles, nightModeColor } from "../styles/nightModeStyles";

function StatusBar() {
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const isNightMode = useSelector((state) => state.isNightMode);

  const dispatch = useDispatch();
  const iconColor = iconNightColor(isNightMode);
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { HIDE_STATUS_BAR } = STRINGS;

  return (
    <ListItem bottomDivider containerStyle={containerNightStyles}>
      {!isStatusBar && <Icon color={iconColor} name="visibility-off" type="material" />}
      {isStatusBar && <Icon color={iconColor} name="visibility" type="material" />}
      <ListItem.Content>
        <ListItem.Title style={nightColor}>{HIDE_STATUS_BAR}</ListItem.Title>
      </ListItem.Content>
      <Switch value={isStatusBar} onValueChange={(value) => dispatch(toggleStatusBar(value))} />
    </ListItem>
  );
}

export default StatusBar;
