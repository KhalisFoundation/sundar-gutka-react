import React, { useEffect } from "react";
import { NativeModules, Platform, StatusBar } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";

const StatusBarComponent = ({ backgroundColor }) => {
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const { theme } = useTheme();
  const barStyle = theme.chrome.statusBarStyle;

  // React Native applies the bar a tick after render, and on Android 11+
  // showing it takes the window out of edge-to-edge (see SystemBarsModule).
  // Put it back once that has run.
  useEffect(() => {
    if (Platform.OS !== "android") return undefined;
    const restore = NativeModules.SystemBars?.restoreEdgeToEdge;
    if (typeof restore !== "function") return undefined;
    const timer = setTimeout(() => restore(), 50);
    return () => clearTimeout(timer);
  }, [isStatusBar]);

  return <StatusBar hidden={isStatusBar} barStyle={barStyle} backgroundColor={backgroundColor} />;
};
StatusBarComponent.propTypes = {
  backgroundColor: PropTypes.string.isRequired,
};

export default StatusBarComponent;
