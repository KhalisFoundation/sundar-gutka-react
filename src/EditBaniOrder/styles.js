import { StyleSheet } from "react-native";
import { constant, colors } from "@common";

export const styles = StyleSheet.create({
  rowItem: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginTop: 1,
  },
  text: {
    fontFamily: constant.GURBANI_AKHAR_TRUE,
    fontSize: 24,
    textAlign: "center",
  },
  gestureHandlerRootView: {
    flex: 1,
  },
});

export const activeColor = (isActive, backColor) => ({
  backgroundColor: isActive ? colors.LABEL_COLORS : backColor,
});

export const nightStyles = (isNightMode) => {
  return {
    backColor: { backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR },
    textColor: { color: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK },
    viewBackColor: { backgroundColor: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_GREY_COLOR },
    headerStyles: {
      backgroundColor: isNightMode ? colors.TOOLBAR_COLOR_ALT2 : colors.TOOLBAR_COLOR_ALT,
      textColor: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK,
    },
  };
};
