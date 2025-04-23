import { StyleSheet } from "react-native";
import { colors } from "@common";

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
  bottomSheetTitle: {
    textAlign: "center",
    fontSize: 20,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleInfoStyle: {
    fontSize: 12,
  },
  end: { padding: 40 },
  avatarStyle: { width: "100%", height: "100%", resizeMode: "contain" },
  viewWrapper: {
    justifyContent: "center",
    marginTop: "auto",
    marginLeft: "auto",
    marginRight: "auto",
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  width_100: {
    width: "98%",
  },
  width_90: {
    width: "70%",
  },
  blurViewStyle: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  androidViewWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
    width: "100%",
  },
  databaseUpdateBannerWrapper: {
    fles: 1,
    flexDirection: "row",
    backgroundColor: colors.HEADER_COLOR_1_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  baniDbImage: { width: 20, height: 20, marginRight: 10 },
  updateText: { color: "#fff", fontSize: 14 },
});
export default styles;
