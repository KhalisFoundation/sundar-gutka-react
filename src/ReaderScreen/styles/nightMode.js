import colors from "../../common/colors";

export const nightColors = (isNightMode) => ({
  backgroundColor: isNightMode
    ? colors.READER_STATUS_BAR_COLOR_NIGHT_MODE
    : colors.READER_STATUS_BAR_COLOR,
  safeAreaViewBack: { backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR },
});
