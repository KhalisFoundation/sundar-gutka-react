import React from "react";
import { ListItem } from "@rneui/themed";
import PropTypes from "prop-types";
import useTheme from "@common/context";

const ListItemTitle = ({ title, style }) => {
  const { theme } = useTheme();
  const textStyle = Array.isArray(style)
    ? [{ fontFamily: theme.typography.fonts.balooPaaji }, ...style]
    : [{ fontFamily: theme.typography.fonts.balooPaaji }, style];

  return (
    <ListItem.Title style={textStyle} allowFontScaling={false}>
      {title}
    </ListItem.Title>
  );
};

ListItemTitle.propTypes = {
  title: PropTypes.string.isRequired,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

ListItemTitle.defaultProps = {
  style: null,
};

export default ListItemTitle;
