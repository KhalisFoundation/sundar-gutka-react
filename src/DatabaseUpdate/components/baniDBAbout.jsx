import React, { useMemo } from "react";
import { Text, View, ScrollView, Linking, Pressable } from "react-native";
import { STRINGS } from "@common";
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
          <Text style={[styles.bulletPoint, darkModeText]}>•</Text>
          <Text style={[styles.listText, darkModeText]}>{highlight}</Text>
        </View>
      ))}
      <Text style={darkModeText}>
        {STRINGS.baniDBMistakeText}{" "}
        <Pressable onPress={() => Linking.openURL("https://tinyurl.com/banidb-signup")}>
          <Text>{STRINGS.baniDBSignUp}</Text>
        </Pressable>
      </Text>
    </ScrollView>
  );
};

export default BaniDBAbout;
