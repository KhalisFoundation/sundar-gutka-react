import React, { useMemo } from "react";
import { Text, View, ScrollView, Linking } from "react-native";
import { STRINGS } from "@common";
import useThemedStyles from "@common/hooks/useThemedStyles";
import useTheme from "@common/context";
import { baniDBAboutStyles } from "./styles";

const BaniDBAbout = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(baniDBAboutStyles);
  const highlights = useMemo(
    () => [
      STRINGS.baniDBHighlight1,
      STRINGS.baniDBHighlight2,
      STRINGS.baniDBHighlight3,
      STRINGS.baniDBHighlight4,
    ],
    []
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {highlights.map((highlight) => (
        <View key={highlight} style={styles.listItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.listText}>{highlight}</Text>
        </View>
      ))}
      <Text style={{ color: theme.colors.primaryText }}>
        {STRINGS.baniDBMistakeText}{" "}
        <Text
          style={{ color: theme.colors.primaryText, textDecorationLine: "underline" }}
          onPress={() => Linking.openURL("https://tinyurl.com/banidb-signup")}
        >
          {STRINGS.baniDBSignUp}
        </Text>
      </Text>
    </ScrollView>
  );
};

export default BaniDBAbout;
