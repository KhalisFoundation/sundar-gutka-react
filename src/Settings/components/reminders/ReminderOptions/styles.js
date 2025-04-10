import { StyleSheet } from "react-native";
import { colors } from "@common";

export const styles = StyleSheet.create({
  viewColumn: { flexDirection: "column" },
  viewRow: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 24 },
  flexView: { flex: 1 },
  timeFont: { fontSize: 44 },
  accContentText: { fontSize: 14 },
  accContentWrapper: { flexDirection: "row", alignItems: "center", margin: 5 },
  modalSelectText: { fontSize: 28 },
  textInput: {
    height: 40,
    borderRadius: 5,
    borderColor: colors.MODAL_ACCENT_NIGHT_MODE_ALT,
    borderWidth: 1,
    padding: 5,
  },
  labelModalWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  labelViewWrapper: { backgroundColor: colors.WHITE_COLOR, padding: 20, width: 300 },
  labelText: { paddingBottom: 5, color: colors.MODAL_ACCENT_NIGHT_MODE },
  labelButtonWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 10,
  },
  modalBackColor: { backgroundColor: colors.NIGHT_GREY_COLOR },
});

export const accordianNightColor = (isNightMode) => {
  const color = isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR;
  return color;
};

export const optionContainer = (isNightMode) => {
  return {
    backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR,
    color: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_GREY_COLOR,
  };
};
