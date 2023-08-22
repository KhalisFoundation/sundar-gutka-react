import constant from "./constant";

const FONT_SIZES = {
  [constant.EXTRA_SMALL]: 18,
  [constant.SMALL]: 24,
  [constant.MEDIUM]: 30,
  [constant.LARGE]: 36,
  [constant.EXTRA_LARGE]: 48,
};

const TRANSLITERATION_MULTIPLIER = 1.2;

const baseFontSize = (size, isTransliteration) => {
  let fontSize = FONT_SIZES[size] || 18; // Default to 18 if size is not recognized

  if (isTransliteration) {
    fontSize /= TRANSLITERATION_MULTIPLIER;
  }

  return fontSize;
};

export default baseFontSize;
