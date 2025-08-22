import { constant, colors } from "@common";

const createStyles = (theme) => ({
  gurmukhiText: {
    margin: 5,
  },
  translit: {
    fontFamily: constant.Arial,
    padding: 0.2,
  },
  englishTranslations: {
    padding: 0.2,
    fontFamily: constant.Arial,
  },
  spanishTranslations: {
    padding: 0.2,
    fontFamily: constant.Arial,
  },
  punjabiTranslations: {
    padding: 0.2,
  },
  vishraamGradient: {
    borderRadius: 5,
  },

  vishraamShort: {
    color: colors.VISHRAM_SHORT,
  },
  larivaarAssist: {
    opacity: 0.65,
  },
  webView: { flex: 1 },
  top50: { marginTop: 50 },
  paragraphStyle: { flex: 1, flexDirection: "row" },
  slider: {
    flex: 1,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 70,
  },
  container: {
    borderRadius: 30,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 0,
    padding: 20,
    overflow: "hidden",
    backgroundColor: theme.colors.primary,
  },
  sliderText: {
    color: theme.staticColors.WHITE_COLOR,
  },
  headerViewWrapper: {
    backgroundColor: theme.colors.primary,
    height: 90,
  },
  headerWrapper: {
    flex: 1,
    flexDirection: "row",
    margin: 10,
    justifyContent: "space-between",
  },
  animatedView: {
    position: "absolute",
    top: 0, // Ensure proper positioning from top
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
    zIndex: 1000, // Higher z-index to ensure visibility
  },
  footerWrapper: {
    paddingLeft: 20,
    paddingRight: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
    height: 60,
  },
  headerTitleStyle: {
    color: theme.staticColors.WHITE_COLOR,
    fontWeight: "normal",
    fontFamily: constant.GURBANI_AKHAR_TRUE,
    fontSize: 20,
  },
  footerTitleStyle: {
    color: theme.staticColors.WHITE_COLOR,
    fontFamily: constant.GURBANI_AKHAR_TRUE,
  },
  headerStyle: {
    backgroundColor: theme.colors.primary,
    height: 90, // Ensure header has proper height
    paddingTop: 40,
  },
});
export default createStyles;
