import React from "react";
import { View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { STRINGS, CustomText, useTheme, useThemedStyles, SafeArea } from "@common";
import createStyles from "../styles";

const BaniHeader = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <SafeArea backgroundColor={theme.mode === "dark" ? "#041126" : theme.colors.surface} edges={["top"]} flex={0}>
      <View style={styles.newHeaderContainer}>
        <CustomText style={styles.newHeaderInvocationText}>
          ॥ ੴ ਸ੍ਰੀ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ ॥
        </CustomText>
        <CustomText style={styles.newHeaderTitleText}>
          {STRINGS.sg_title}
        </CustomText>
        <LinearGradient
          colors={
            theme.mode === "dark"
              ? ["#051C41", "#63B3ED", "#051C41"]
              : ["#113979", "#90CDF4", "#113979"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.newHeaderGradientDivider}
        />
      </View>
    </SafeArea>
  );
};

export default BaniHeader;
