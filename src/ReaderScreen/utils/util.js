import { baseFontSize } from "../../common/helpers";
import constant from "../../common/constant";
import colors from "../../common/colors";

export const fontColorForReader = (header, nightMode, text) => {
  const colorMapping = {
    [constant.GURMUKHI]: {
      1: nightMode ? colors.HEADER_COLOR_1_DARK : colors.HEADER_COLOR_1_LIGHT,
      2: nightMode ? colors.SLIDER_TRACK_MIN_TINT : colors.HEADER_COLOR_2_LIGHT,
      6: nightMode ? colors.SLIDER_TRACK_MIN_TINT : colors.HEADER_COLOR_2_LIGHT,
      default: nightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK,
    },
    [constant.TRANSLITERATION]: nightMode
      ? colors.HEADER_COLOR_1_DARK
      : colors.HEADER_COLOR_1_LIGHT,
    [constant.TRANSLATION]: nightMode ? colors.SLIDER_TRACK_MIN_TINT : colors.HEADER_COLOR_2_LIGHT,
  };

  const color = colorMapping[text];

  if (typeof color === "object") {
    return color[header] || color.default;
  }

  return color || null;
};

export const fontSizeForReader = (SIZE, header, transliteration) => {
  const size = 0.9;
  const fontSize = baseFontSize(SIZE, transliteration) * size;
  if (header === 6) {
    return fontSize * 0.75;
  }
  if (header === 2) {
    return fontSize * 1.1;
  }
  if (header === 1) {
    return fontSize * 1.2;
  }
  return fontSize;
};
