import colors from "../../common/colors";

const nightStyles = (isNightMode) => {
  const { NIGHT_BLACK, WHITE_COLOR } = colors;
  return { backgroundColor: isNightMode ? NIGHT_BLACK : WHITE_COLOR };
};

export default nightStyles;
