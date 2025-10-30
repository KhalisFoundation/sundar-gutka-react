import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { toggleScreenAwake, toggleAutoScroll } from "@common/actions";
import useTheme from "@common/context";
import { STRINGS, ListItemTitle } from "@common";

const AutoScroll = () => {
  const { theme } = useTheme();
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
  const isAudio = useSelector((state) => state.isAudio);
  const dispatch = useDispatch();
  const { AUTO_SCROLL } = STRINGS;
  return (
    <ListItem bottomDivider containerStyle={{ backgroundColor: theme.colors.surfaceGrey }}>
      <Icon color={theme.colors.primaryText} name="auto-fix-high" type="material" />
      <ListItem.Content>
        <ListItemTitle title={AUTO_SCROLL} style={{ color: theme.colors.primaryText }} />
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
