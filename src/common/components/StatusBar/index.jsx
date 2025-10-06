import React from "react";
import { StatusBar, Platform, View } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";

const StatusBarComponent = ({ backgroundColor }) => {
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const { theme } = useTheme();
  const barStyle = theme.mode === "dark" ? "light-content" : "dark-content";

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
