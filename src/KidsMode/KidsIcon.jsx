import React from "react";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";

// The header's IconAction takes an icon component with size and colour; the Kids Mode
// glyph is a Material Community icon rather than one of the app's SVGs.
const KidsIcon = ({ size, color }) => (
  <Icon name="account-child-outline" type="material-community" size={size} color={color} />
);

KidsIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

export default KidsIcon;
