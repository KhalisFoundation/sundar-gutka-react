import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ListItem, Avatar, Icon, Switch } from "@rneui/themed";
import { toggleLarivaar, toggleLarivaarAssist } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, ListItemTitle } from "@common";
import createStyles from "../styles";

const LarivaarComponent = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isLarivaar = useSelector((state) => state.isLarivaar);
  const isLarivaarAssist = useSelector((state) => state.isLarivaarAssist);

  const dispatch = useDispatch();
  const larivaarIcon = require("../../../images/larivaaricon.png");
  return (
    <>
      <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
        <Avatar source={larivaarIcon} avatarStyle={styles.avatarStyle} />
        <ListItem.Content>
          <ListItemTitle title={STRINGS.larivaar} style={styles.listItemTitle} />
        </ListItem.Content>
        <Switch value={isLarivaar} onValueChange={(value) => dispatch(toggleLarivaar(value))} />
      </ListItem>
      {isLarivaar && (
        <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
          <Icon name="opacity" size={30} color={theme.colors.primaryText} />
          <ListItem.Content>
            <ListItemTitle title={STRINGS.larivaar_assist} style={styles.listItemTitle} />
          </ListItem.Content>
          <Switch
            value={isLarivaarAssist}
            onValueChange={(value) => dispatch(toggleLarivaarAssist(value))}
          />
        </ListItem>
      )}
    </>
  );
};

export default LarivaarComponent;
