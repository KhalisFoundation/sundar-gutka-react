import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { ListItem, Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import { iconNightColor, nightModeStyles, nightModeColor } from "../../styles/nightModeStyles";

const ListItemWithIcon = ({ iconName, title, navigate, navigationTarget }) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const iconColor = useMemo(() => iconNightColor(isNightMode), [isNightMode]);
  const { containerNightStyles } = useMemo(() => nightModeStyles(isNightMode), [isNightMode]);
  const nightColor = useMemo(() => nightModeColor(isNightMode), [isNightMode]);

  return (
    <ListItem
      containerStyle={containerNightStyles}
      bottomDivider
      onPress={() => navigate(navigationTarget)}
    >
      <Icon name={iconName} size={30} color={iconColor} />
      <ListItem.Content>
        <ListItem.Title style={nightColor}>{title}</ListItem.Title>
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
