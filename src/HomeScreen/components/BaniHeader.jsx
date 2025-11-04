import React from "react";
import { View } from "react-native";
import { STRINGS, CustomText, useTheme, useThemedStyles } from "@common";
import createStyles from "../styles";

const BaniHeader = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={{
        backgroundColor: theme.colors.primary,
      }}
    >
      <View style={styles.fatehContainer}>
        <CustomText style={styles.headerFatehStyle}>
          <CustomText style={styles.ikongkar}>{"<>"} </CustomText>
          {STRINGS.fateh}
        </CustomText>
      </View>
      <View>
        <CustomText style={styles.titleContainer}>
          <CustomText style={styles.headerDesign}>Œ</CustomText>
          <CustomText style={styles.headerTitle}> {STRINGS.sg_title} </CustomText>
          <CustomText style={styles.headerDesign}>‰</CustomText>
        </CustomText>
      </View>
    </View>
  );
};
export default BaniHeader;
