import React from "react";
import { Linking } from "react-native";
import { ListItem, Icon } from "@rneui/themed";
import { STRINGS, useTheme, useThemedStyles, ListItemTitle } from "@common";
import createStyles from "../styles";

const Donate = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { donate } = STRINGS;
  return (
    <ListItem
      bottomDivider
      containerStyle={styles.containerNightStyles}
      onPress={() => Linking.openURL("https://khalisfoundation.org/donate/")}
    >
      <Icon color={theme.colors.primaryText} name="volunteer-activism" size={30} />
      <ListItem.Content>
        <ListItemTitle title={donate} style={styles.listItemTitle} />
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
};
export default Donate;
