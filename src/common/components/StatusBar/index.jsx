import React from "react";
import { StatusBar } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

const StatusBarComponent = ({ backgroundColor }) => {
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const isNightMode = useSelector((state) => state.isNightMode);
  return (
    <StatusBar
      hidden={isStatusBar}
      backgroundColor={backgroundColor}
      barStyle={isNightMode ? "light-content" : "dark-content"}
    />
  );
};
StatusBarComponent.propTypes = {
  backgroundColor: PropTypes.string.isRequired,
};

export default StatusBarComponent;
