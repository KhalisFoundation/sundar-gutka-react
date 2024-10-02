import colors from "../common/colors";
import constant from "../common/constant";

const getHeaderStyles = () => ({
  headerTitleStyle: {
    color: colors.WHITE_COLOR,
    fontWeight: "normal",
    fontFamily: constant.GURBANI_AKHAR_TRUE,
    fontSize: 20,
  },
  headerStyle: {
    backgroundColor: colors.TOOLBAR_COLOR,
  },
});
export default getHeaderStyles;
