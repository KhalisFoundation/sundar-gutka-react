import React from "react";
import { StatusBar, Platform, View } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

const StatusBarComponent = ({ backgroundColor }) => {
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const isNightMode = useSelector((state) => state.isNightMode);

  const barStyle = isNightMode ? "light-content" : "dark-content";

  if (Platform.OS === "ios") {
    return (
      <View style={{ backgroundColor }}>
        <StatusBar
          hidden={isStatusBar}
          barStyle={barStyle}
          backgroundColor="transparent"
          translucent
        />
      </View>
    );
  }

  return <StatusBar hidden={isStatusBar} barStyle={barStyle} backgroundColor={backgroundColor} />;
};
StatusBarComponent.propTypes = {
  backgroundColor: PropTypes.string.isRequired,
};

export default StatusBarComponent;
