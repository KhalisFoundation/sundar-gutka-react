import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListItem, Switch, Avatar } from "@rneui/themed";
import { toggleScreenAwake } from "@common/actions";
import { STRINGS, useThemedStyles, ListItemTitle } from "@common";
import createStyles from "../styles";

const KeepAwake = () => {
  const styles = useThemedStyles(createStyles);
  const dispatch = useDispatch();
  const isScreenAwake = useSelector((state) => state.isScreenAwake);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);

  const { KEEP_AWAKE } = STRINGS;
  const screenIcon = require("../../../images/screenonicon.png");
  return (
    <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
      <Avatar source={screenIcon} avatarStyle={styles.avatarStyle} />
      <ListItem.Content>
        <ListItemTitle title={KEEP_AWAKE} style={styles.listItemTitle} />
      </ListItem.Content>
      <Switch
        value={isScreenAwake}
        disabled={isAutoScroll}
        onValueChange={(value) => dispatch(toggleScreenAwake(value))}
      />
    </ListItem>
  );
};
export default KeepAwake;
