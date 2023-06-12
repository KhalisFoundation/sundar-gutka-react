import constant from "./constant";
export const baseFontSize = (size, isTransliteration) => {
  let fontSize;

  switch (size) {
    case constant.EXTRA_SMALL:
      fontSize = 18;
      break;
    case constant.SMALL:
      fontSize = 24;
      break;
    case constant.LARGE:
      fontSize = 36;
      break;
    case constant.EXTRA_LARGE:
      fontSize = 48;
      break;
    default:
      fontSize = 18;
  }

  if (isTransliteration) fontSize /= 1.2;
  return fontSize;
};
