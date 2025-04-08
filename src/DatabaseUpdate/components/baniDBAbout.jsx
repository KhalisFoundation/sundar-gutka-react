import React from "react";
import { Text, View, ScrollView, Linking } from "react-native";
import { baniDBAboutStyles as styles } from "./styles";

const BaniDBAbout = () => {
  const highlights = [
    "World&apos;s Most Accurate Gurbani Database: Over 43,000 corrections and counting.",
    " Meticulously Checked: Data from Sri Guru Granth Sahib Ji has undergone numerous reviews.",
    "Unique Standardization: Focuses on accurate lagamatras (spelling) and padh chhedh (wordseparation).",
    "Distinct From SGPC Publications: The only database standardized independently from SGPC&apos;s Gurbani pothis.",
  ];
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {highlights.map((highlight) => (
        <View key={highlight} style={styles.listItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.listText}>{highlight}</Text>
        </View>
      ))}
      <Text style={styles.text}>
        Found a mistake in Gurbani? Have a better translation? Become a contributor to BaniDB!
        Visit:{" "}
        <Text onPress={() => Linking.openURL("https://tinyurl.com/banidb-signup")}>
          BaniDB-signup{" "}
        </Text>
        for instructions.
      </Text>
    </ScrollView>
  );
};
export default BaniDBAbout;
