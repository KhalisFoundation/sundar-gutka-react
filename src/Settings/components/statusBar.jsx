import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { toggleStatusBar } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import STRINGS from "@common/localization";
import createStyles from "../styles";

const StatusBar = () => {
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const dispatch = useDispatch();
  const { HIDE_STATUS_BAR } = STRINGS;

  return (
    <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
      {!isStatusBar && (
        <Icon color={theme.colors.primaryText} name="visibility-off" type="material" />
      )}
      {isStatusBar && <Icon color={theme.colors.primaryText} name="visibility" type="material" />}
      <ListItem.Content>
        <ListItem.Title style={styles.listItemTitle} allowFontScaling={false}>
          {HIDE_STATUS_BAR}
        </ListItem.Title>
      </ListItem.Content>
      <Switch value={isStatusBar} onValueChange={(value) => dispatch(toggleStatusBar(value))} />
    </ListItem>
  );
};

export default StatusBar;
