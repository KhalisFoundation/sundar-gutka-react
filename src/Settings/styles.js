import { StyleSheet } from "react-native";
import colors from "../common/colors";

const styles = StyleSheet.create({
  iconStyle: { alignSelf: "flex-start" },
  headerView: { backgroundColor: colors.TOOLBAR_COLOR_ALT, padding: 15 },
  settingText: {
    fontSize: 18,
    alignSelf: "center",
    color: colors.TOOLBAR_TINT_DARK,
    position: "absolute",
    top: 20,
  },
  settingsView: { backgroundColor: colors.TOOLBAR_COLOR_ALT },
  displayOptionsText: { backgroundColor: colors.LABEL_COLORS, padding: 7 },
});
export default styles;
