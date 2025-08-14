import { StyleSheet } from "react-native";
import colors from "../../colors";
import constant from "../../constant";

const styles = StyleSheet.create({
  heading: {
    color: colors.TOOLBAR_TINT,
    fontFamily: constant.BALOO_PAAJI_Medium,
    textAlign: "center",
    fontSize: 52,
  },
  viewWrapper: {
    margin: 10,
  },
  wrapper: {
    flex: 1,
    backgroundColor: colors.TOOLBAR_COLOR,
  },
  baniLengthMessage: {
    marginTop: 15,
    color: colors.TOOLBAR_TINT,
    fontSize: 14,
  },
  textPreferrence: {
    marginTop: 15,
    color: colors.TOOLBAR_COLOR_ALT,
    fontWeight: "bold",
    fontSize: 18,
  },
  button: {
    backgroundColor: colors.WHITE_COLOR,
    color: colors.TOOLBAR_COLOR,
    padding: 15,
    marginTop: 15,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  helpText: {
    color: colors.TOOLBAR_COLOR_ALT,
    fontWeight: "bold",
    fontStyle: "italic",
    fontSize: 12,
  },
  moreInfo: {
    color: colors.TOOLBAR_TINT,
    fontWeight: "normal",
    fontSize: 12,
  },
  helpWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
});
export default styles;
