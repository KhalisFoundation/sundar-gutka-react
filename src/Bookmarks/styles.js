import { colors, constant } from "@common";

export const getHeaderStyle = (isNightMode) => ({
  backgroundColor: !isNightMode ? colors.WHITE : colors.BLACK,
});

export const nightMode = (isNightMode) => ({
  backgroundColor: isNightMode ? colors.BLACK : colors.WHITE,
});
export const getHeaderTitleStyle = (isNightMode) => ({
  color: isNightMode ? colors.WHITE_COLOR : colors.READER_HEADER_COLOR,
  fontWeight: "normal",
  fontSize: 20,
  fontFamily: constant.GURMUKHI_AKHAR_TRUE,
});
