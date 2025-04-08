import React from "react";
import { View, Image, Linking, TouchableHighlight } from "react-native";
import { constant } from "@common";
import CheckUpdatesAnimation from "./components/checkUpdate";
import BaniDBAbout from "./components/baniDBAbout";
import styles from "./styles";

const BaniDBIntroScreen = () => {
  const baniDBLogoFull = require("../../images/banidb-logo-full.png");

  return (
    <View style={styles.mainWrapper}>
      <CheckUpdatesAnimation />
      <TouchableHighlight onPress={() => Linking.openURL(constant.BANI_DB_URL)}>
        <Image source={baniDBLogoFull} width={20} height={20} style={styles.baniDBLogoImage} />
      </TouchableHighlight>
      <BaniDBAbout />
    </View>
  );
};

export default BaniDBIntroScreen;
