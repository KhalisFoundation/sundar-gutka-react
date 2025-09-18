import { StyleSheet } from "react-native";
import { constant, colors } from "@common";

export const styles = StyleSheet.create({
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
  vishraamBasic: {
    color: colors.VISHRAM_BASIC,
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
    paddingVertical: 0,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  sliderText: {
    color: colors.TOOLBAR_TINT,
  },
  headerViewWrapper: {
    backgroundColor: colors.READER_HEADER_COLOR,
    height: 90,
  },
  headerWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "95%",
    marginLeft: "auto",
    marginRight: "auto",
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
});
export const getHeaderStyles = (isNightMode) => ({
  headerTitleStyle: {
    color: isNightMode ? colors.WHITE_COLOR : colors.READER_HEADER_COLOR,
    fontSize: 20,
    zIndex: 1,
  },
  footerTitleStyle: {
    color: colors.WHITE_COLOR,
    fontFamily: constant.GURBANI_AKHAR_TRUE,
  },

  headerStyle: {
    backgroundColor: !isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK,
  },
});
