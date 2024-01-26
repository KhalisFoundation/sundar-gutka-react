import React from "react";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { iconNightColor, nightModeStyles, nightModeColor } from "../styles/nightModeStyles";
import STRINGS from "../../common/localization";
import { toggleScreenAwake, toggleAutoScroll } from "../../common/actions";

function AutoScroll() {
  const { isNightMode } = useSelector((state) => state.isNightMode);
  const { isAutoScroll } = useSelector((state) => state.isAutoScroll);
  const dispatch = useDispatch();
  const iconColor = iconNightColor(isNightMode);
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { AUTO_SCROLL } = STRINGS;
  return (
    <ListItem bottomDivider containerStyle={containerNightStyles}>
      <Icon color={iconColor} name="auto-fix-high" type="material" />
      <ListItem.Content>
        <ListItem.Title style={nightColor}>{AUTO_SCROLL}</ListItem.Title>
      </ListItem.Content>
      <Switch
        value={isAutoScroll}
        onValueChange={(value) => {
          /* The screen should remain active whenever Auto Scroll is enabled. */
          dispatch(toggleScreenAwake(value));
          dispatch(toggleAutoScroll(value));
        }}
      />
    </ListItem>
  );
}
export default AutoScroll;
