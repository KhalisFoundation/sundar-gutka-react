import React from "react";
import { ListItem, Avatar, Switch } from "@rneui/themed";
import { useDispatch, useSelector } from "react-redux";
import { STRINGS, actions } from "@common";
import { nightModeStyles, nightModeColor } from "../styles/nightModeStyles";
import { styles } from "../styles";

const CollectStatistics = () => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const isStatistics = useSelector((state) => state.isStatistics);
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { COLLECT_STATISTICS } = STRINGS;
  const analyticsIcon = require("../../../images/analyticsicon.png");
  const dispatch = useDispatch();
  return (
    <ListItem bottomDivider containerStyle={containerNightStyles}>
      <Avatar source={analyticsIcon} avatarStyle={styles.avatarStyle} />
      <ListItem.Content>
        <ListItem.Title style={nightColor} allowFontScaling={false}>
          {COLLECT_STATISTICS}
        </ListItem.Title>
      </ListItem.Content>
      <Switch
        value={isStatistics}
        onValueChange={(value) => dispatch(actions.toggleStatistics(value))}
      />
    </ListItem>
  );
};
export default CollectStatistics;
