import React from "react";
import { Linking, Image, View, Text, TouchableHighlight } from "react-native";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { getVersion, getBuildNumber } from "react-native-device-info";
import {
  colors,
  STRINGS,
  constant,
  useScreenAnalytics,
  logMessage,
  StatusBarComponent,
  SafeArea,
} from "@common";
import { styles, nightStyles } from "./styles";
import useHeader from "./hooks/useHeader";

const AboutScreen = ({ navigation }) => {
  logMessage(constant.ABOUT_SCREEN);
  const isNightMode = useSelector((state) => state.isNightMode);

  useScreenAnalytics(constant.ABOUT_SCREEN);
  useHeader(navigation);
  const { backgroundColor } = nightStyles(isNightMode);
  const { TOOLBAR_COLOR_ALT2 } = colors;
  const { nightMode, SGTitle, margin10, margin, singleLine, leftContainer, underlayColor } = styles;
  const {
    CREATED_BY,
    SUNDAR_GUTKA,
    ABOUT_WELCOME,
    ABOUT_HELP,
    ABOUT_RESPECT,
    ABOUT_SG,
    ABOUT_OPEN_SOURCE,
    ABOUT_PARDON,
    BANI_DB,
    APP_VERSION,
    KHALIS_FOUNDATION,
  } = STRINGS;
  const { KHALIS_FOUNDATION_URL } = constant;
  const khalislogo150 = require("../../images/khalislogo150.png");
  const khalislogo150white = require("../../images/khalislogo150white.png");
  const baniDBLogo = require("../../images/banidblogo.png");

  return (
    <SafeArea backgroundColor={backgroundColor}>
      <View
        style={[
          {
            flex: 1,
            backgroundColor,
          },
        ]}
      >
        <StatusBarComponent backgroundColor={TOOLBAR_COLOR_ALT2} />
        <View style={margin10}>
          <Text style={[isNightMode && nightMode, SGTitle]}>{SUNDAR_GUTKA}</Text>
          <Text style={[margin, isNightMode && nightMode]}>{CREATED_BY}:</Text>
          <TouchableHighlight
            underlayColor={underlayColor.color}
            onPress={() => Linking.openURL(KHALIS_FOUNDATION_URL)}
          >
            <Image source={isNightMode ? khalislogo150white : khalislogo150} />
          </TouchableHighlight>
          <Text style={[isNightMode && nightMode, margin]}>{ABOUT_WELCOME}</Text>

          <View style={margin}>
            <Text style={[isNightMode && nightMode]}>{ABOUT_HELP}</Text>
            <Text style={underlayColor} onPress={() => Linking.openURL(KHALIS_FOUNDATION_URL)}>
              {KHALIS_FOUNDATION_URL}
            </Text>
          </View>

          <Text style={[isNightMode && nightMode, margin]}>{ABOUT_RESPECT}</Text>
          <Text style={[isNightMode && nightMode, margin]}>
            {ABOUT_SG}{" "}
            <Text style={underlayColor} onPress={() => Linking.openURL(constant.BANI_DB_URL)}>
              {BANI_DB}
            </Text>
            <Text> {ABOUT_OPEN_SOURCE}</Text>
          </Text>

          <TouchableHighlight
            style={margin}
            underlayColor={underlayColor.color}
            onPress={() => Linking.openURL(constant.BANI_DB_URL)}
          >
            <Image source={baniDBLogo} />
          </TouchableHighlight>
          <Text style={[isNightMode && nightMode, margin]}>{ABOUT_PARDON}</Text>

          <View style={singleLine}>
            <View style={leftContainer}>
              <Text style={[margin, isNightMode && nightMode]}>
                &copy; {new Date().getFullYear()} {KHALIS_FOUNDATION}
              </Text>
            </View>
            <Text style={[margin, isNightMode && nightMode]}>
              {APP_VERSION}: {getVersion()} ({getBuildNumber()})
            </Text>
          </View>
        </View>
      </View>
    </SafeArea>
  );
};

AboutScreen.propTypes = { navigation: PropTypes.shape().isRequired };

export default AboutScreen;
