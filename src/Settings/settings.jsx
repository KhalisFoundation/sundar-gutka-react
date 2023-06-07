import { Icon } from "@rneui/themed";
import React from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { SafeAreaView, StatusBar, View, Text } from "react-native";
import STRINGS from "../common/localization";
import ListComponent from "./ListComponents";
import colors from "../common/colors";
import styles from "./styles";

function HeaderComponent({ backNav }) {
  const { isNightMode } = useSelector((state) => state);
  return (
    <View
      style={[
        styles.headerView,
        isNightMode && { backgroundColor: colors.TOOLBAR_COLOR_ALT_NIGHT_MODE },
      ]}
    >
      <Icon
        style={styles.iconStyle}
        name="arrow-back"
        size={30}
        onPress={() => {
          backNav();
        }}
        color={isNightMode ? colors.TOOLBAR_TINT : colors.TOOLBAR_TINT_DARK}
      />
      <Text style={[styles.settingText, isNightMode && { color: colors.TOOLBAR_TINT }]}>
        {STRINGS.settings}
      </Text>
    </View>
  );
}

function Settings({ navigation }) {
  const { isNightMode } = useSelector((state) => state);

  const { goBack } = navigation;
  return (
    <SafeAreaView
      style={[
        styles.settingsView,
        isNightMode && { backgroundColor: colors.TOOLBAR_COLOR_ALT_NIGHT_MODE },
      ]}
    >
      <StatusBar barStyle={isNightMode ? "light-content" : "dark-content"} />
      <HeaderComponent backNav={goBack} />
      <ListComponent />
    </SafeAreaView>
  );
}

Settings.propTypes = { navigation: PropTypes.shape().isRequired };
HeaderComponent.propTypes = { backNav: PropTypes.func.isRequired };

export default Settings;
