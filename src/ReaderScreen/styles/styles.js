import { StyleSheet } from "react-native";
import constant from "../../common/constant";
import colors from "../../common/colors";

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
  vishramBasic: {
    color: colors.VISHRAM_BASIC,
  },
  vishramShort: {
    color: colors.VISHRAM_SHORT,
  },
  larivaarAssist: {
    opacity: 0.65,
  },
  paragraphStyle: { flex: 1, flexDirection: "row" },
  slider: {
    flex: 1,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
    marginTop: 50,
    margin: 10,
    justifyContent: "space-between",
  },
  top50: {
    top: 50,
  },
  animatedView: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
});

export const getHeaderStyles = (isNightMode) => ({
  headerTitleStyle: {
    color: colors.WHITE_COLOR,
    fontWeight: "normal",
    fontFamily: constant.GURBANI_AKHAR_TRUE,
    fontSize: 20,
  },
  headerStyle: {
    backgroundColor: !isNightMode
      ? colors.READER_STATUS_BAR_COLOR
      : colors.READER_STATUS_BAR_COLOR_NIGHT_MODE,
  },
});
