import colors from "../common/colors";
import constant from "../common/constant";

const getHeaderStyles = (isNightMode) => ({
  headerTitleStyle: {
    color: colors.WHITE_COLOR,
    fontWeight: "normal",
    fontFamily: constant.GURBANI_AKHAR_TRUE,
    fontSize: 20,
  },
  headerStyle: {
    backgroundColor: !isNightMode
      ? colors.TOOLBAR_COLOR
      : colors.READER_STATUS_BAR_COLOR_NIGHT_MODE,
  },
});
export default getHeaderStyles;
