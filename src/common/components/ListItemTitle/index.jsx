import React from "react";
import { ListItem } from "@rneui/themed";
import PropTypes from "prop-types";

const ListItemTitle = ({ title, style }) => {
  return (
    <ListItem.Title style={style} allowFontScaling={false}>
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
