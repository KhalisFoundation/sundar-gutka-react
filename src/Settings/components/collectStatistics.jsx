import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ListItem, Avatar, Switch } from "@rneui/themed";
import { STRINGS, actions, useThemedStyles } from "@common";
import createStyles from "../styles";

const CollectStatistics = () => {
  const isStatistics = useSelector((state) => state.isStatistics);
  const styles = useThemedStyles(createStyles);
  const { COLLECT_STATISTICS } = STRINGS;
  const analyticsIcon = require("../../../images/analyticsicon.png");
  const dispatch = useDispatch();
  return (
    <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
      <Avatar source={analyticsIcon} avatarStyle={styles.avatarStyle} />
      <ListItem.Content>
        <ListItem.Title style={styles.listItemTitle} allowFontScaling={false}>
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
