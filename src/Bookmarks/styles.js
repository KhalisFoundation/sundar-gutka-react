import { StyleSheet } from "react-native";
import colors from "../common/colors";

export const styles = StyleSheet.create({
  headerTitleStyle: {
    color: colors.WHITE_COLOR,
    fontWeight: "normal",
    fontSize: 20,
  },
});

export const getHeaderStyle = (isNightMode) => ({
  backgroundColor: !isNightMode ? colors.TOOLBAR_COLOR_ALT : colors.TOOLBAR_COLOR_ALT_NIGHT_MODE,
});
