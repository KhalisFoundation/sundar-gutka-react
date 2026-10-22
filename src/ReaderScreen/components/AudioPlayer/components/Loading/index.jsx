import React from "react";
import { View } from "react-native";
import { Spinner } from "@common/components/ui";
import { useAudioTheme, useAudioThemedStyles } from "../../useAudioTheme";
import createStyles from "./styles";

const Loading = () => {
  const { theme } = useAudioTheme();
  const styles = useAudioThemedStyles(createStyles);
  return (
    <View style={styles.loadingContainer}>
      <Spinner size="large" color={theme.c.textBrand} />
    </View>
  );
};

export default Loading;
