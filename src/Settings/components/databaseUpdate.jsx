import PropTypes from "prop-types";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { STRINGS } from "@common";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "../styles";

const baniDbLogo = require("../../../images/banidblogo.png");

const DatabaseUpdateBanner = ({ navigate }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable onPress={() => navigate("DatabaseUpdate")}>
      <View style={styles.databaseUpdateBannerWrapper}>
        <Image source={baniDbLogo} style={styles.baniDbImage} />
        <Text style={styles.updateText}>{STRINGS.baniDBBannerText}</Text>
      </View>
    </Pressable>
  );
};
DatabaseUpdateBanner.propTypes = { navigate: PropTypes.func.isRequired };

export default DatabaseUpdateBanner;
