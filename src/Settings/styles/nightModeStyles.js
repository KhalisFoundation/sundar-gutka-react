import colors from "../../common/colors";

export const nightModeStyles = (isNightMode) => ({
  scrollViewNightStyles: {
    backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.LABEL_COLORS,
    color: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK,
  },
  containerNightStyles: {
    backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR,
  },
  backgroundNightStyle: {
    backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR,
  },
  textNightStyle: {
    color: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK,
  },
  textNightGrey: {
    color: isNightMode ? colors.WHITE_COLOR : colors.DISABLED_TEXT_COLOR,
  },
});

export const iconNightColor = (isNightMode) => {
  const color = isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR;
  return color;
};

export const nightModeColor = (isNightMode) => ({
  color: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK,
});
