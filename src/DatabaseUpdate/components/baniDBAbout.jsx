import React, { useMemo } from "react";
import { View, ScrollView, Linking } from "react-native";
import { STRINGS, CustomText, useTheme, useThemedStyles } from "@common";
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
          <CustomText style={styles.bulletPoint}>•</CustomText>
          <CustomText style={styles.listText}>{highlight}</CustomText>
        </View>
      ))}
      <CustomText style={{ color: theme.colors.primaryText }}>
        {STRINGS.baniDBMistakeText}{" "}
        <CustomText
          style={{ color: theme.colors.primaryText, textDecorationLine: "underline" }}
          onPress={() => Linking.openURL("https://tinyurl.com/banidb-signup")}
        >
          {STRINGS.baniDBSignUp}
        </CustomText>
      </CustomText>
    </ScrollView>
  );
};

export default BaniDBAbout;
