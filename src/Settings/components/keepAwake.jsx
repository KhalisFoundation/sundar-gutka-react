import React from "react";
import { ListItem, Switch, Avatar } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { nightModeStyles, nightModeColor } from "../styles/nightModeStyles";
import STRINGS from "../../common/localization";
import { toggleScreenAwake } from "../../common/actions";

function KeepAwake() {
  const dispatch = useDispatch();
  const { isNightMode, isScreenAwake, isAutoScroll } = useSelector((state) => state);
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { KEEP_AWAKE } = STRINGS;
  const screenIcon = require("../../../images/screenonicon.png");
  return (
    <ListItem bottomDivider containerStyle={containerNightStyles}>
      <Avatar title="Keep Awake Icon" source={screenIcon} />
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
}
export default KeepAwake;
