import PropTypes from "prop-types";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { STRINGS, CustomText } from "@common";
import { styles } from "../styles";

const baniDbLogo = require("../../../images/banidblogo.png");

const DatabaseUpdateBanner = ({ navigate }) => {
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
