import { StyleSheet } from "react-native";
import { colors, constant } from "@common";

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 0 },
  header: { backgroundColor: colors.primary },
  fateh: { color: colors.TOOLBAR_TINT, fontSize: 18, textAlign: "center", margin: 5 },
  headerDesign: {
    fontSize: 32,
    color: colors.TOOLBAR_TINT,
    fontFamily: constant.GURBANI_AKHAR_TRUE,
  },
  headerTitle: { fontSize: 28, color: colors.TOOLBAR_TINT },
  titleContainer: { textAlign: "center", margin: 5 },
  settingIcon: { position: "absolute", bottom: 10, right: 5 },
  headerFatehStyle: { color: colors.TOOLBAR_TINT, fontSize: 22 },
  fatehContainer: {
    marginTop: 20,
    marginLeft: "auto",
    marginRight: "auto",
  },
  ikongkar: {
    fontFamily: constant.GURBANI_AKHAR_TRUE,
    color: colors.TOOLBAR_TINT,
    fontSize: 22,
  },
});

export default styles;
