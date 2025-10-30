import React from "react";
import { Linking, Image, View, TouchableHighlight } from "react-native";
import { getVersion, getBuildNumber } from "react-native-device-info";
import PropTypes from "prop-types";
import {
  STRINGS,
  constant,
  useScreenAnalytics,
  logMessage,
  StatusBarComponent,
  SafeArea,
  CustomText,
  useTheme,
  useThemedStyles,
} from "@common";
import useHeader from "./hooks/useHeader";
import createStyles from "./styles";

const AboutScreen = ({ navigation }) => {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  logMessage(constant.ABOUT_SCREEN);

  useScreenAnalytics(constant.ABOUT_SCREEN);
  useHeader(navigation);
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

  return (
    <SafeArea backgroundColor={theme.colors.surface}>
      <View style={styles.mainWrapper}>
        <StatusBarComponent backgroundColor={styles.headerStyle.backgroundColor} />
        <View style={styles.wrapper}>
          <CustomText style={styles.titleText}>{SUNDAR_GUTKA}</CustomText>
          <CustomText style={styles.createdByText}>{CREATED_BY}:</CustomText>
          <TouchableHighlight onPress={() => Linking.openURL(KHALIS_FOUNDATION_URL)}>
            <Image source={theme.images.khalisLogo} />
          </TouchableHighlight>
          <CustomText style={styles.welcomeText}>{ABOUT_WELCOME}</CustomText>

          <View style={styles.margin}>
            <CustomText style={styles.helpText}>{ABOUT_HELP}</CustomText>
            <CustomText
              style={styles.linkText}
              onPress={() => Linking.openURL(KHALIS_FOUNDATION_URL)}
            >
              {KHALIS_FOUNDATION_URL}
            </CustomText>
          </View>

          <CustomText style={styles.respectText}>{ABOUT_RESPECT}</CustomText>
          <CustomText style={styles.sgText}>
            {ABOUT_SG}{" "}
            <CustomText
              style={styles.linkText}
              onPress={() => Linking.openURL(constant.BANI_DB_URL)}
            >
              {BANI_DB}
            </CustomText>
            <CustomText> {ABOUT_OPEN_SOURCE}</CustomText>
          </CustomText>

          <TouchableHighlight
            style={styles.margin}
            onPress={() => Linking.openURL(constant.BANI_DB_URL)}
          >
            <Image source={theme.images.baniDBLogo} style={styles.logo} />
          </TouchableHighlight>
          <CustomText style={styles.pardonText}>{ABOUT_PARDON}</CustomText>

          <View style={styles.singleLine}>
            <View style={styles.leftContainer}>
              <CustomText style={styles.footerText}>
                &copy; {new Date().getFullYear()} {KHALIS_FOUNDATION}
              </CustomText>
            </View>
            <CustomText style={styles.footerText}>
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
