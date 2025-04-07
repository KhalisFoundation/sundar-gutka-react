import React from "react";
import {
  Text,
  ScrollView,
  StyleSheet,
  View,
  Image,
  Linking,
  TouchableHighlight,
} from "react-native";
import { constant } from "@common";
import CheckUpdatesAnimation from "./components/checkUpdate";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    marginRight: 10,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});

const BaniDBIntroScreen = () => {
  const baniDBLogoFull = require("../../images/banidb-logo-full.png");

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <CheckUpdatesAnimation />
      <TouchableHighlight onPress={() => Linking.openURL(constant.BANI_DB_URL)}>
        <Image source={baniDBLogoFull} width={20} height={20} style={{ alignSelf: "center" }} />
      </TouchableHighlight>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.listItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.listText}>
            World&apos;s Most Accurate Gurbani Database: Over 43,000 corrections and counting.
          </Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.listText}>
            Meticulously Checked: Data from Sri Guru Granth Sahib Ji has undergone numerous reviews.
          </Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.listText}>
            Unique Standardization: Focuses on accurate lagamatras (spelling) and padh chhedh (word
            separation).
          </Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.listText}>
            Distinct From SGPC Publications: The only database standardized independently from
            SGPC&apos;s Gurbani pothis.
          </Text>
        </View>
        <Text style={styles.text}>
          Found a mistake in Gurbani? Have a better translation? Become a contributor to BaniDB!
          Visit:{" "}
          <Text onPress={() => Linking.openURL("https://tinyurl.com/banidb-signup")}>
            BaniDB-signup{" "}
          </Text>
          for instructions.
        </Text>
      </ScrollView>
    </View>
  );
};

export default BaniDBIntroScreen;
