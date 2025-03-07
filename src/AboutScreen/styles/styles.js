import { StyleSheet } from "react-native";
import colors from "@common/colors";

const styles = StyleSheet.create({
  nightMode: { backgroundColor: colors.NIGHT_BLACK, color: colors.WHITE_COLOR },
  margin: { marginTop: 20 },
  SGTitle: { fontSize: 20, fontWeight: "bold" },
  singleLine: { flexDirection: "row", justifyContent: "space-between" },
  headerTitleStyle: { color: colors.WHITE_COLOR, fontWeight: "normal", fontSize: 18 },
  headerStyle: { backgroundColor: colors.TOOLBAR_COLOR_ALT2 },
  margin10: { margin: 10 },
  underlayColor: { color: colors.UNDERLAY_COLOR },
});
export default styles;
