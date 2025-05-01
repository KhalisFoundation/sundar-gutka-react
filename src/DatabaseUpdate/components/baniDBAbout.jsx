import React from "react";
import { Text, View, ScrollView, Linking } from "react-native";
import { STRINGS } from "@common";
import { useSelector } from "react-redux";
import { baniDBAboutStyles as styles, darkMode } from "./styles";

const BaniDBAbout = () => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const highlights = [
    STRINGS.baniDBHighlight1,
    STRINGS.baniDBHighlight2,
    STRINGS.baniDBHighlight3,
    STRINGS.baniDBHighlight4,
  ];
  const { darkModeContainer, darkModeText } = darkMode(isNightMode);

  return (
    <ScrollView contentContainerStyle={[styles.container, darkModeContainer]}>
      {highlights.map((highlight) => (
        <View key={highlight} style={styles.listItem}>
          <Text style={[styles.bulletPoint, darkModeText]}>•</Text>
          <Text style={[styles.listText, darkModeText]}>{highlight}</Text>
        </View>
      ))}
      <Text style={darkModeText}>
        {STRINGS.baniDBMistakeText}{" "}
        <Text onPress={() => Linking.openURL("https://tinyurl.com/banidb-signup")}>
          {STRINGS.baniDBSignUp}
        </Text>
      </Text>
    </ScrollView>
  );
};

export default BaniDBAbout;
