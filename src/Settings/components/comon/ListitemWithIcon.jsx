import React from "react";
import { ListItem, Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { ListItemTitle } from "@common";
import createStyles from "../../styles";

const ListItemWithIcon = ({ iconName, title, navigate, navigationTarget }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <ListItem
      containerStyle={styles.containerNightStyles}
      bottomDivider
      onPress={() => navigate(navigationTarget)}
    >
      <Icon name={iconName} size={30} color={theme.colors.primaryText} />
      <ListItem.Content>
        <ListItemTitle title={title} style={styles.listItemTitle} />
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
};

ListItemWithIcon.propTypes = {
  iconName: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  navigate: PropTypes.func.isRequired,
  navigationTarget: PropTypes.string.isRequired,
};

export default ListItemWithIcon;
