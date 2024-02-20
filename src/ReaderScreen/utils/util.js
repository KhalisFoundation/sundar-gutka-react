import baseFontSize from "../../common/helpers";
import constant from "../../common/constant";
import colors from "../../common/colors";

export const fontColorForReader = (header, nightMode, text) => {
  const { HEADER_COLOR_1_DARK, HEADER_COLOR_1_LIGHT, WHITE_COLOR, NIGHT_BLACK } = colors;

  const getHeaderColor1 = () => (nightMode ? HEADER_COLOR_1_DARK : HEADER_COLOR_1_LIGHT);
  const getHeaderColor2 = () => (nightMode ? WHITE_COLOR : NIGHT_BLACK);

  const defaultColor = getHeaderColor2();
  const gurmukhiMapping = {
    1: getHeaderColor1(),
    2: defaultColor,
    6: defaultColor,
    default: defaultColor,
  };

  const colorMapping = {
    [constant.GURMUKHI]: gurmukhiMapping,
    [constant.TRANSLITERATION]: getHeaderColor1(),
    [constant.TRANSLATION]: defaultColor,
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
  switch (header) {
    case 6:
      return fontSize * 0.75;
    case 2:
      return fontSize * 1.1;
    case 1:
      return fontSize * 1.2;
    default:
      return fontSize;
  }
};
