import { StyleSheet } from "react-native";
import { colors, constant } from "@common";

export const styles = StyleSheet.create({
  headerTitleStyle: {
    color: colors.READER_HEADER_COLOR,
    fontWeight: "normal",
    fontSize: 20,
    fontFamily: constant.BALOO_PAAJI_Medium,
  },
});

export const getHeaderStyle = (isNightMode) => ({
  backgroundColor: !isNightMode ? colors.WHITE : colors.BLACK,
});

export const nightMode = (isNightMode) => ({
  backgroundColor: isNightMode ? colors.BLACK : colors.WHITE,
});
