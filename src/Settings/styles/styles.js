import { StyleSheet } from "react-native";
import colors from "@common/colors";

const styles = StyleSheet.create({
  nightBackColor: { backgdroundColor: colors.NIGHT_BLACK },
  iconStyle: { alignSelf: "flex-start" },
  imageStyle: {},
  headerView: { backgroundColor: colors.TOOLBAR_COLOR_ALT, padding: 15 },
  settingText: {
    fontSize: 18,
    alignSelf: "center",
    color: colors.TOOLBAR_TINT_DARK,
    position: "absolute",
    top: 20,
  },
  settingsView: { backgroundColor: colors.TOOLBAR_COLOR_ALT },
  displayOptionsText: { padding: 7 },
  bottomSheetTitle: { textAlign: "center", fontSize: 20, padding: 15 },
  titleInfoStyle: {
    fontSize: 12,
  },
  end: { padding: 40 },
  avatarStyle: { width: "100%", height: "100%", resizeMode: "contain" },
  viewWrapper: {
    marginLeft: "auto",
    marginRight: "auto",
    bottom: 0,
  },
  width_100: {
    width: "100%",
  },
  width_90: {
    width: "90%",
  },
  backdropStyle: { backgroundColor: "rgba(0,0,0,0.6)" },
});
export default styles;
