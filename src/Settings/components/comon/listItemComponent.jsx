import React, { useMemo } from "react";
import { ListItem, Avatar, Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { styles, nightModeStyles, iconNightColor } from "../../styles";

const ListItemComponent = ({ icon, title, value, isAvatar, actionConstant, onPressAction }) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const { containerNightStyles, textNightStyle, textNightGrey } = useMemo(
    () => nightModeStyles(isNightMode),
    [isNightMode]
  );
  const iconColor = useMemo(() => iconNightColor(isNightMode), [isNightMode]);
  return (
    <ListItem bottomDivider containerStyle={containerNightStyles} onPress={onPressAction}>
      {isAvatar && <Avatar source={Number(icon)} avatarStyle={styles.avatarStyle} />}
      {!isAvatar && <Icon name={icon} color={iconColor} size={30} />}
      <ListItem.Content>
        <ListItem.Title style={textNightStyle} allowFontScaling={false}>
          {title}
        </ListItem.Title>
      </ListItem.Content>
      {value && (
        <ListItem.Title style={[styles.titleInfoStyle, textNightGrey]} allowFontScaling={false}>
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
