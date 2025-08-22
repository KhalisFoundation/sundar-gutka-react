import React from "react";
import { ListItem, Avatar, Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "../../styles";

const ListItemComponent = ({ icon, title, value, isAvatar, actionConstant, onPressAction }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <ListItem bottomDivider containerStyle={styles.containerNightStyles} onPress={onPressAction}>
      {isAvatar && <Avatar source={Number(icon)} avatarStyle={styles.avatarStyle} />}
      {!isAvatar && <Icon name={icon} color={theme.colors.primaryText} size={30} />}
      <ListItem.Content>
        <ListItem.Title style={styles.listItemTitle}>{title}</ListItem.Title>
      </ListItem.Content>
      {value && (
        <ListItem.Title style={[styles.titleInfoStyle, styles.listItemTitle]}>
          {actionConstant.filter((item) => item.key === value).map((item) => item.title)[0]}
        </ListItem.Title>
      )}
      <ListItem.Chevron />
    </ListItem>
  );
};
ListItemComponent.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  isAvatar: PropTypes.bool.isRequired,
  actionConstant: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  onPressAction: PropTypes.func.isRequired,
};

export default ListItemComponent;
