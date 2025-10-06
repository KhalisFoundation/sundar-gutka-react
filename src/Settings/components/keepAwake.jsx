import React from "react";
import { ListItem, Switch, Avatar } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { STRINGS } from "@common";
import { toggleScreenAwake } from "@common/actions";
import useThemedStyles from "@common/hooks/useThemedStyles";
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
        <ListItem.Title style={styles.listItemTitle}>{KEEP_AWAKE}</ListItem.Title>
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
