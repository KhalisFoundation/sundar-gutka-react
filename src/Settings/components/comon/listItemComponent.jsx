import React from "react";
import { ListItem, Avatar, Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { styles, nightModeStyles, iconNightColor } from "../../styles";

function ListItemComponent({ icon, title, value, isAvatar, actionConstant, onPressAction }) {
  const { isNightMode } = useSelector((state) => state);
  const { containerNightStyles, textNightStyle, textNightGrey } = nightModeStyles(isNightMode);
  const iconColor = iconNightColor(isNightMode);
  return (
    <ListItem bottomDivider containerStyle={containerNightStyles} onPress={onPressAction}>
      {isAvatar && <Avatar source={Number(icon)} />}
      {!isAvatar && <Icon name={icon} style={styles.imageStyle} color={iconColor} size={30} />}
      <ListItem.Content>
        <ListItem.Title style={textNightStyle}>{title}</ListItem.Title>
      </ListItem.Content>
      {value && (
        <ListItem.Title style={[styles.titleInfoStyle, textNightGrey]}>
          {actionConstant.filter((item) => item.key === value).map((item) => item.title)[0]}
        </ListItem.Title>
      )}
      <ListItem.Chevron />
    </ListItem>
  );
}
ListItemComponent.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  isAvatar: PropTypes.bool.isRequired,
  actionConstant: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  onPressAction: PropTypes.func.isRequired,
};

export default ListItemComponent;
