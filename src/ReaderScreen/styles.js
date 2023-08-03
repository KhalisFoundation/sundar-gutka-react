import { StyleSheet } from "react-native";
import constant from "../common/constant";
import colors from "../common/colors";

const styles = StyleSheet.create({
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
});

export default styles;
