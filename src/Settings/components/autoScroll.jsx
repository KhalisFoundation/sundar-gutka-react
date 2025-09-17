import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { toggleScreenAwake, toggleAutoScroll } from "@common/actions";
import { STRINGS } from "@common";
import { iconNightColor, nightModeStyles, nightModeColor } from "../styles/nightModeStyles";

const AutoScroll = () => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
  const isAudio = useSelector((state) => state.isAudio);
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
        disabled={isAudio}
        onValueChange={(value) => {
          /* The screen should remain active whenever Auto Scroll is enabled. */
          dispatch(toggleScreenAwake(value));
          dispatch(toggleAutoScroll(value));
        }}
      />
    </ListItem>
  );
};
export default AutoScroll;
