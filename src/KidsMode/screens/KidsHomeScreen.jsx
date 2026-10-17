import React from "react";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, CustomText, SafeArea, StatusBarComponent } from "@common";
import createStyles from "./styles";

const KidsHomeScreen = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <SafeArea backgroundColor={theme.colors.surface}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      <CustomText style={styles.title}>{STRINGS.KIDS_MODE}</CustomText>
      <CustomText style={styles.subtitle}>{STRINGS.KIDS_COMING_SOON}</CustomText>
    </SafeArea>
  );
};

export default KidsHomeScreen;
