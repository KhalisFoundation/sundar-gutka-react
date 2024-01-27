import colors from "../../common/colors";

const nightColors = (isNightMode) => {
  let bgColor;
  let safeAreaViewColor;
  let backViewColor;

  if (isNightMode) {
    bgColor = colors.READER_STATUS_BAR_COLOR_NIGHT_MODE;
    safeAreaViewColor = colors.NIGHT_BLACK;
    backViewColor = colors.NIGHT_BLACK;
  } else {
    bgColor = colors.READER_STATUS_BAR_COLOR;
    safeAreaViewColor = colors.WHITE_COLOR;
    backViewColor = colors.WHITE_COLOR;
  }

  return {
    backgroundColor: bgColor,
    safeAreaViewBack: { backgroundColor: safeAreaViewColor },
    backViewColor: { backgroundColor: backViewColor },
  };
};

export default nightColors;
