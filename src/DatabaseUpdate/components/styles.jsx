import { StyleSheet } from "react-native";
import { colors } from "@common";

export const checkUpdateStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 20,
    marginBottom: 5,
  },
  status: {
    marginTop: 20,
    fontSize: 18,
  },
  mainWrapper: {},
});

export const baniDBAboutStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    marginRight: 10,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});

export const darkMode = (isNightMode) => ({
  darkModeContainer: {
    backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR,
  },
  darkModeText: {
    color: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK,
  },
});
