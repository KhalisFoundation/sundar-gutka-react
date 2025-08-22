import React from "react";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { STRINGS } from "@common";
import { toggleScreenAwake, toggleAutoScroll } from "@common/actions";
import useTheme from "@common/context";

const AutoScroll = () => {
  const { theme } = useTheme();
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
  const dispatch = useDispatch();
  const { AUTO_SCROLL } = STRINGS;
  return (
    <ListItem bottomDivider containerStyle={{ backgroundColor: theme.colors.surfaceGrey }}>
      <Icon color={theme.colors.primaryText} name="auto-fix-high" type="material" />
      <ListItem.Content>
        <ListItem.Title style={{ color: theme.colors.primaryText }}>{AUTO_SCROLL}</ListItem.Title>
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
};
export default AutoScroll;
