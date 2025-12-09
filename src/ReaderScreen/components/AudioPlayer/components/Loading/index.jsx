import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useTheme, useThemedStyles } from "@common";
import createStyles from "./styles";

const Loading = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

export default Loading;
