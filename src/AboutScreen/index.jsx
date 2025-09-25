import React from "react";
import { Linking, Image, View, TouchableHighlight } from "react-native";
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
  CustomText,
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
          <CustomText style={[isNightMode && nightMode, SGTitle]}>{SUNDAR_GUTKA}</CustomText>
          <CustomText style={[margin, isNightMode && nightMode]}>{CREATED_BY}:</CustomText>
          <TouchableHighlight
            underlayColor={underlayColor.color}
            onPress={() => Linking.openURL(KHALIS_FOUNDATION_URL)}
          >
            <Image source={isNightMode ? khalislogo150white : khalislogo150} />
          </TouchableHighlight>
          <CustomText style={[isNightMode && nightMode, margin]}>{ABOUT_WELCOME}</CustomText>

          <View style={margin}>
            <CustomText style={[isNightMode && nightMode]}>{ABOUT_HELP}</CustomText>
            <CustomText
              style={underlayColor}
              onPress={() => Linking.openURL(KHALIS_FOUNDATION_URL)}
            >
              {KHALIS_FOUNDATION_URL}
            </CustomText>
          </View>

          <CustomText style={[isNightMode && nightMode, margin]}>{ABOUT_RESPECT}</CustomText>
          <CustomText style={[isNightMode && nightMode, margin]}>
            {ABOUT_SG}{" "}
            <CustomText style={underlayColor} onPress={() => Linking.openURL(constant.BANI_DB_URL)}>
              {BANI_DB}
            </CustomText>
            <CustomText> {ABOUT_OPEN_SOURCE}</CustomText>
          </CustomText>

          <TouchableHighlight
            style={margin}
            underlayColor={underlayColor.color}
            onPress={() => Linking.openURL(constant.BANI_DB_URL)}
          >
            <Image source={baniDBLogo} />
          </TouchableHighlight>
          <CustomText style={[isNightMode && nightMode, margin]}>{ABOUT_PARDON}</CustomText>

          <View style={singleLine}>
            <View style={leftContainer}>
              <CustomText style={[margin, isNightMode && nightMode]}>
                &copy; {new Date().getFullYear()} {KHALIS_FOUNDATION}
              </CustomText>
            </View>
            <CustomText style={[margin, isNightMode && nightMode]}>
              {APP_VERSION}: {getVersion()} ({getBuildNumber()})
            </CustomText>
          </View>
        </View>
      </View>
    </SafeArea>
  );
};

AboutScreen.propTypes = { navigation: PropTypes.shape().isRequired };

export default AboutScreen;
