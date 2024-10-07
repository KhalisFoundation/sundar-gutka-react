import { StyleSheet } from "react-native";
import { colors, constant } from "@common";

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 0 },
  header: { backgroundColor: colors.TOOLBAR_COLOR },
  fateh: { color: colors.TOOLBAR_TINT, fontSize: 18, textAlign: "center", margin: 5 },
  headerDesign: {
    fontSize: 32,
    color: colors.TOOLBAR_TINT,
    fontFamily: constant.GURBANI_AKHAR_TRUE,
  },
  headerTitle: { fontSize: 28, color: colors.TOOLBAR_TINT },
  titleContainer: { textAlign: "center", margin: 5 },
  settingIcon: { position: "absolute", bottom: 10, right: 5 },
  headerFatehStyle: { fontSize: 22, color: colors.TOOLBAR_TINT },
  fatehContainer: { marginTop: 50, marginLeft: "auto", marginRight: "auto" },
});

export default styles;
