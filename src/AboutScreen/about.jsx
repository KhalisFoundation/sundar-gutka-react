import React, { useEffect } from "react";
import { Linking, Image, StatusBar, View, Text, TouchableHighlight } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { getVersion, getBuildNumber } from "react-native-device-info";
import colors from "../common/colors";
import STRINGS from "../common/localization";
import styles from "./styles";
import constant from "../common/constant";
import useScreenAnalytics from "../common/hooks/useScreenAnalytics";

function AboutScreen({ navigation }) {
  const { isNightMode, isStatusBar } = useSelector((state) => state);
  useScreenAnalytics(constant.ABOUT_SCREEN);
  const headerLeft = () => (
    <Icon
      name="arrow-back"
      size={30}
      onPress={() => navigation.goBack()}
      color={colors.WHITE_COLOR}
    />
  );
  useEffect(() => {
    navigation.setOptions({
      headerTitleStyle: {
        color: colors.WHITE_COLOR,
        fontWeight: "normal",
        fontSize: 18,
      },
      headerStyle: {
        backgroundColor: colors.TOOLBAR_COLOR_ALT2,
      },
      headerLeft,
    });
  }, []);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR,
      }}
    >
      <StatusBar
        hidden={isStatusBar}
        backgroundColor={colors.TOOLBAR_COLOR_ALT2}
        barStyle="light-content"
      />
      <View style={{ margin: 10 }}>
        <Text style={[isNightMode && styles.nightMode, styles.SGTitle]}>
          {STRINGS.sundar_gutka}
        </Text>
        <Text style={[styles.margin, isNightMode && styles.nightMode]}>{STRINGS.created_by}:</Text>
        <TouchableHighlight
          underlayColor={colors.UNDERLAY_COLOR}
          onPress={() => Linking.openURL(constant.KHALIS_FOUNDATION_URL)}
        >
          <Image
            source={
              isNightMode
                ? require("../../images/khalislogo150white.png")
                : require("../../images/khalislogo150.png")
            }
          />
        </TouchableHighlight>
        <Text style={[isNightMode && styles.nightMode, styles.margin]}>{STRINGS.about_1}</Text>

        <View style={styles.margin}>
          <Text style={[isNightMode && styles.nightMode]}>{STRINGS.about_2}</Text>
          <Text
            style={{ color: colors.UNDERLAY_COLOR }}
            onPress={() => Linking.openURL(constant.KHALIS_FOUNDATION_URL)}
          >
            {constant.KHALIS_FOUNDATION_URL}
          </Text>
        </View>

        <Text style={[isNightMode && styles.nightMode, styles.margin]}>{STRINGS.about_3}</Text>
        <Text style={[isNightMode && styles.nightMode, styles.margin]}>
          {STRINGS.about_4}{" "}
          <Text
            style={{ color: colors.UNDERLAY_COLOR }}
            onPress={() => Linking.openURL(constant.BANI_DB_URL)}
          >
            {STRINGS.baniDB}
          </Text>
          <Text> {STRINGS.about_5}</Text>
        </Text>

        <TouchableHighlight
          style={styles.margin}
          underlayColor={colors.UNDERLAY_COLOR}
          onPress={() => Linking.openURL(constant.BANI_DB_URL)}
        >
          <Image source={require("../../images/banidblogo.png")} />
        </TouchableHighlight>
        <Text style={[isNightMode && styles.nightMode, styles.margin]}>{STRINGS.about_6}</Text>

        <View style={styles.singleLine}>
          <View style={styles.leftContainer}>
            <Text style={[styles.margin, isNightMode && styles.nightMode]}>
              &copy; {new Date().getFullYear()} {STRINGS.khalis_foundation}
            </Text>
          </View>
          <Text style={[styles.margin, isNightMode && styles.nightMode]}>
            {STRINGS.app_version}: {getVersion()} ({getBuildNumber()})
          </Text>
        </View>
      </View>
    </View>
  );
}

AboutScreen.propTypes = { navigation: PropTypes.shape().isRequired };

export default AboutScreen;
