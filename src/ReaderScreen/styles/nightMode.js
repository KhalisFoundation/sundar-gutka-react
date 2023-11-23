import colors from "../../common/colors";

const nightColors = (isNightMode) => {
  let bgColor;
  let safeAreaViewColor;

  if (isNightMode) {
    bgColor = colors.READER_STATUS_BAR_COLOR_NIGHT_MODE;
    safeAreaViewColor = colors.NIGHT_BLACK;
  } else {
    bgColor = colors.READER_STATUS_BAR_COLOR;
    safeAreaViewColor = colors.WHITE_COLOR;
  }

  return {
    backgroundColor: bgColor,
    safeAreaViewBack: { backgroundColor: safeAreaViewColor },
  };
};

export default nightColors;
