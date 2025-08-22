import colors from "../../colors";
import constant from "../../constant";

const createStyles = (theme) => ({
  heading: {
    color: theme.colors.primaryText,
    fontFamily: constant.GURBANI_AKHAR_THICK_TRUE,
    textAlign: "center",
    fontSize: 52,
  },
  viewWrapper: {
    margin: 10,
  },
  wrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  baniLengthMessage: {
    marginTop: 15,
    color: theme.colors.primaryText,
    fontSize: 14,
  },
  textPreferrence: {
    marginTop: 15,
    color: theme.colors.primaryVariant,
    fontWeight: "bold",
    fontSize: 18,
  },
  button: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.primaryText,
    padding: 15,
    marginTop: 15,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  helpText: {
    color: theme.colors.primaryVariant,
    fontWeight: "bold",
    fontStyle: "italic",
    fontSize: 12,
  },
  moreInfo: {
    color: theme.colors.primaryText,
    fontWeight: "normal",
    fontSize: 12,
  },
  helpWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
});
export default createStyles;
