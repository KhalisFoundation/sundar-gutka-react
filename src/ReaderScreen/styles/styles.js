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
    marginTop: 50,
    margin: 10,
    justifyContent: "space-between",
  },
  animatedView: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
    zIndex: 1,
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
    color: colors.WHITE_COLOR,
    fontWeight: "normal",
    fontFamily: constant.GURBANI_AKHAR_TRUE,
    fontSize: 20,
  },
  footerTitleStyle: {
    color: colors.WHITE_COLOR,
    fontFamily: constant.GURBANI_AKHAR_TRUE,
  },

  headerStyle: {
    backgroundColor: !isNightMode
      ? colors.READER_STATUS_BAR_COLOR
      : colors.READER_STATUS_BAR_COLOR_NIGHT_MODE,
  },
});
