import React from "react";
import { StatusBar, Platform, View } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

const StatusBarComponent = ({ backgroundColor }) => {
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const isNightMode = useSelector((state) => state.isNightMode);

  if (Platform.OS === "ios") {
    return (
      <View style={{ backgroundColor }}>
        <StatusBar
          hidden={isStatusBar}
          barStyle={isNightMode ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />
      </View>
    );
  }

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
