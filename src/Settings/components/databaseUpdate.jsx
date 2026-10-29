import React from "react";
import { Image, Pressable, View } from "react-native";
import PropTypes from "prop-types";
import { STRINGS, CustomText, useThemedStyles } from "@common";
// eslint-disable-next-line import/order -- the logo below is an image asset require
import createStyles from "../styles";

const baniDbLogo = require("../../../images/banidblogo.png");

const DatabaseUpdateBanner = ({ navigate }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable onPress={() => navigate("DatabaseUpdate")}>
      <View style={styles.databaseUpdateBannerWrapper}>
        <Image source={baniDbLogo} style={styles.baniDbImage} />
        <CustomText style={styles.updateText}>{STRINGS.baniDBBannerText}</CustomText>
      </View>
    </Pressable>
  );
};
DatabaseUpdateBanner.propTypes = { navigate: PropTypes.func.isRequired };

export default DatabaseUpdateBanner;
