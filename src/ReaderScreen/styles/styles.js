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
    paddingTop: 0,
    padding: 20,
    overflow: "hidden",
    backgroundColor: colors.READER_FOOTER_COLOR,
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
  },
  animatedView: {
    position: "absolute",
    top: 0, // Ensure proper positioning from top
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
    zIndex: 1000, // Higher z-index to ensure visibility
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.READER_HEADER_COLOR,
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
    color: colors.READER_HEADER_COLOR,
    fontWeight: "normal",
    fontFamily: constant.BALOO_PAAJI_Medium,
    fontSize: 20,
    zIndex: 1,
  },
  footerTitleStyle: {
    color: colors.WHITE_COLOR,
    fontFamily: constant.BALOO_PAAJI,
  },

  headerStyle: {
    backgroundColor: !isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK,
    height: 90, // Ensure header has proper height
    paddingTop: 40,
  },
});
