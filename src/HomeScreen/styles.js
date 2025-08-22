import { constant } from "@common";

const createStyles = (theme) => ({
  container: { flex: 1, marginTop: 0 },
  header: { backgroundColor: theme.colors.primary },
  fateh: { color: theme.staticColors.WHITE_COLOR, fontSize: 18, textAlign: "center", margin: 5 },
  headerDesign: {
    fontSize: 32,
    color: theme.staticColors.WHITE_COLOR,
    fontFamily: constant.GURBANI_AKHAR_TRUE,
  },
  headerTitle: { fontSize: 28, color: theme.staticColors.WHITE_COLOR },
  titleContainer: { textAlign: "center", margin: 5 },
  settingIcon: {
    position: "absolute",
    bottom: 10,
    right: 5,
  },
  headerFatehStyle: { color: theme.staticColors.WHITE_COLOR, fontSize: 22 },
  fatehContainer: {
    marginTop: 20,
    marginLeft: "auto",
    marginRight: "auto",
  },
  ikongkar: {
    fontFamily: constant.GURBANI_AKHAR_TRUE,
    color: theme.colors.WHITE_COLOR,
    fontSize: 22,
  },
});

export default createStyles;
