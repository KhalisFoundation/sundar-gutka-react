import React, { useMemo } from "react";
import { View, ScrollView, Linking } from "react-native";
import { STRINGS, CustomText } from "@common";
import { useSelector } from "react-redux";
import { baniDBAboutStyles as styles, darkMode } from "./styles";

const BaniDBAbout = () => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const highlights = useMemo(
    () => [
      STRINGS.baniDBHighlight1,
      STRINGS.baniDBHighlight2,
      STRINGS.baniDBHighlight3,
      STRINGS.baniDBHighlight4,
    ],
    []
  );

  const { darkModeContainer, darkModeText } = useMemo(() => darkMode(isNightMode), [isNightMode]);

  return (
    <ScrollView contentContainerStyle={[styles.container, darkModeContainer]}>
      {highlights.map((highlight) => (
        <View key={highlight} style={styles.listItem}>
          <CustomText style={[styles.bulletPoint, darkModeText]}>•</CustomText>
          <CustomText style={[styles.listText, darkModeText]}>{highlight}</CustomText>
        </View>
      ))}
      <CustomText style={darkModeText}>
        {STRINGS.baniDBMistakeText}{" "}
        <CustomText
          style={[darkModeText, { textDecorationLine: "underline" }]}
          onPress={() => Linking.openURL("https://tinyurl.com/banidb-signup")}
        >
          {STRINGS.baniDBSignUp}
        </CustomText>
      </CustomText>
    </ScrollView>
  );
};

export default BaniDBAbout;
