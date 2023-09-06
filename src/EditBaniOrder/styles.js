import { StyleSheet } from "react-native";
import colors from "../common/colors";
import constant from "../common/constant";

export const styles = StyleSheet.create({
  rowItem: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginTop: 1,
  },
  text: {
    color: colors.NIGHT_BLACK,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: constant.GURBANI_AKHAR_TRUE,
  },
  gestureBackColor: {
    backgroundColor: colors.LABEL_COLORS,
  },
});

export const activeColor = (isActive, backColor) => ({
  backgroundColor: isActive ? colors.LABEL_COLORS : backColor,
});

export const nightStyles = (isNightMode) => {
  return {
    backColor: { backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR },
    textColor: { color: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK },
  };
};
