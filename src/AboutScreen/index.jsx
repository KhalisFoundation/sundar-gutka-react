import React from "react";
import { Linking, Image, View, Text, TouchableHighlight } from "react-native";
import { getVersion, getBuildNumber } from "react-native-device-info";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import {
  STRINGS,
  constant,
  useScreenAnalytics,
  logMessage,
  StatusBarComponent,
  SafeArea,
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
          <Text style={styles.titleText}>{SUNDAR_GUTKA}</Text>
          <Text style={styles.createdByText}>{CREATED_BY}:</Text>
          <TouchableHighlight onPress={() => Linking.openURL(KHALIS_FOUNDATION_URL)}>
            <Image source={theme.images.khalisLogo} />
          </TouchableHighlight>
          <Text style={styles.welcomeText}>{ABOUT_WELCOME}</Text>

          <View style={styles.margin}>
            <Text style={styles.helpText}>{ABOUT_HELP}</Text>
            <Text style={styles.linkText} onPress={() => Linking.openURL(KHALIS_FOUNDATION_URL)}>
              {KHALIS_FOUNDATION_URL}
            </Text>
          </View>

          <Text style={styles.respectText}>{ABOUT_RESPECT}</Text>
          <Text style={styles.sgText}>
            {ABOUT_SG}{" "}
            <Text style={styles.linkText} onPress={() => Linking.openURL(constant.BANI_DB_URL)}>
              {BANI_DB}
            </Text>
            <Text> {ABOUT_OPEN_SOURCE}</Text>
          </Text>

          <TouchableHighlight
            style={styles.margin}
            onPress={() => Linking.openURL(constant.BANI_DB_URL)}
          >
            <Image source={theme.images.baniDBLogo} style={styles.logo} />
          </TouchableHighlight>
          <Text style={styles.pardonText}>{ABOUT_PARDON}</Text>

          <View style={styles.singleLine}>
            <View style={styles.leftContainer}>
              <Text style={styles.footerText}>
                &copy; {new Date().getFullYear()} {KHALIS_FOUNDATION}
              </Text>
            </View>
            <Text style={styles.footerText}>
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
