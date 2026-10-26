import React from "react";
import PropTypes from "prop-types";
import SettingsRow from "./SettingsRow";

// A setting that navigates to another screen. A thin adapter over
// `SettingsRow` so it stays identical to every other row.
const ListItemWithIcon = ({ iconName, title, navigate, navigationTarget }) => (
  <SettingsRow title={title} icon={iconName} onPress={() => navigate(navigationTarget)} />
);

ListItemWithIcon.propTypes = {
  iconName: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  navigate: PropTypes.func.isRequired,
  navigationTarget: PropTypes.string.isRequired,
};

export default ListItemWithIcon;
