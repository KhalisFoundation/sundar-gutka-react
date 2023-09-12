import React from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { SafeAreaView, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ListComponent from "./ListComponents";
import colors from "../common/colors";
import useScreenAnalytics from "../common/hooks/useScreenAnalytics";
import constant from "../common/constant";
import { nightModeStyles } from "./styles/nightModeStyles";

function Settings({ navigation }) {
  useScreenAnalytics(constant.SETTINGS);
  const { isNightMode, isStatusBar } = useSelector((state) => state);
  const { scrollViewNightStyles } = nightModeStyles(isNightMode);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={scrollViewNightStyles}>
        <StatusBar
          hidden={isStatusBar}
          barStyle={isNightMode ? "light-content" : "dark-content"}
          backgroundColor={
            !isNightMode ? colors.TOOLBAR_COLOR_ALT : colors.TOOLBAR_COLOR_ALT_NIGHT_MODE
          }
        />
        <ListComponent navigation={navigation} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

Settings.propTypes = { navigation: PropTypes.shape({ navigate: PropTypes.func }).isRequired };

export default Settings;
