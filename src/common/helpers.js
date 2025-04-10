import constant from "./constant";
import defaultBaniOrder from "./defaultBaniOrder";

const FONT_SIZES = {
  [constant.EXTRA_SMALL]: 18,
  [constant.SMALL]: 24,
  [constant.MEDIUM]: 30,
  [constant.LARGE]: 36,
  [constant.EXTRA_LARGE]: 48,
};

const TRANSLITERATION_MULTIPLIER = 1.25;

const baseFontSize = (size, isTransliteration) => {
  let fontSize = FONT_SIZES[size] || 18; // Default to 18 if size is not recognized
  if (isTransliteration) {
    fontSize /= TRANSLITERATION_MULTIPLIER;
  }

  return fontSize;
};
export const validateBaniOrder = (baniOrder) => {
  const isValidBaniOrder = baniOrder?.baniOrder?.length > 0;
  const order = isValidBaniOrder ? baniOrder : defaultBaniOrder;
  return order;
};

export default baseFontSize;
