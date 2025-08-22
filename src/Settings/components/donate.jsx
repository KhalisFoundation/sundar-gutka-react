import React from "react";
import { Linking } from "react-native";
import { ListItem, Icon } from "@rneui/themed";
import { STRINGS } from "@common";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
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
        <ListItem.Title style={styles.listItemTitle}>{donate}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
};
export default Donate;
