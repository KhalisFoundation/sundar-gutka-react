import { StyleSheet } from "react-native";
import colors from "../common/colors";

export const styles = StyleSheet.create({
  homeHeaderTitle: { fontSize: 18, color: colors.WHITE_COLOR, fontWeight: "normal" },
  homeHeaderStyle: { backgroundColor: colors.TOOLBAR_COLOR },
});

export const getSettingsStyle = (isNightMode) => ({
  headerTitleStyle: {
    color: !isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR,
    fontWeight: "normal",
  },
  headerStyle: {
    backgroundColor: !isNightMode ? colors.TOOLBAR_COLOR_ALT : colors.TOOLBAR_COLOR_ALT_NIGHT_MODE,
  },
});
