import React from "react";
import { ListItem, Switch, Avatar } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { STRINGS } from "@common";
import { toggleScreenAwake } from "@common/actions";
import { nightModeStyles, nightModeColor } from "../styles/nightModeStyles";
import { styles } from "../styles";

const KeepAwake = () => {
  const dispatch = useDispatch();
  const isNightMode = useSelector((state) => state.isNightMode);
  const isScreenAwake = useSelector((state) => state.isScreenAwake);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);

  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { KEEP_AWAKE } = STRINGS;
  const screenIcon = require("../../../images/screenonicon.png");
  return (
    <ListItem bottomDivider containerStyle={containerNightStyles}>
      <Avatar source={screenIcon} avatarStyle={styles.avatarStyle} />
      <ListItem.Content>
        <ListItem.Title style={nightColor}>{KEEP_AWAKE}</ListItem.Title>
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
