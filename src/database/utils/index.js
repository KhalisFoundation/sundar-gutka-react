import { constant, colors } from "../../common";

export const getTranslitText = (translit, language) => {
  const json = JSON.parse(translit);
  switch (language) {
    case constant.ENGLISH:
      return json.en;
    case constant.HINDI:
      return json.hi;
    case constant.SHAHMUKHI:
      return json.ur;
    case constant.IPA:
      return json.ipa;
    default:
      return json.en;
  }
};
export const parseVishraamPositions = (vishraamJson, source) => {
  const positions = {};
  if (vishraamJson && vishraamJson[source] && vishraamJson[source].length > 0) {
    vishraamJson[source].forEach((pos) => {
      positions[pos.p] = pos.t;
    });
  }
  return positions;
};
export const getWordStyle = (
  word,
  index,
  vishraamPositions,

  { isVishraam, vishraamOption, isLarivar, isLarivarAssist }
) => {
  let style = "";
  const { VISHRAM_LONG, VISHRAM_SHORT, VISHRAM_LONG_GRADIENT, VISHRAM_SHORT_GRADIENT } = colors;
  const { VISHRAAM_GRADIENT, VISHRAAM_COLORED } = constant;
  if (isVishraam && vishraamPositions[index]) {
    switch (vishraamOption) {
      case VISHRAAM_GRADIENT:
        style += `border-radius: 5px; background: linear-gradient(to right,rgba(229, 229, 229, 0) 20%, ${
          vishraamPositions[index] === "v" ? VISHRAM_LONG_GRADIENT : VISHRAM_SHORT_GRADIENT
        }`;
        style += "100%);";
        break;
      case VISHRAAM_COLORED:
        style += `color: ${vishraamPositions[index] === "v" ? VISHRAM_LONG : VISHRAM_SHORT};`;
        break;
      default:
        style += "color:";
        style += vishraamPositions[index] === "v" ? `${VISHRAM_LONG}` : `${VISHRAM_SHORT};`;
        break;
    }
  }

  if (isLarivar && isLarivarAssist && index % 2 !== 0) {
    style += " opacity: .65;";
  }

  return style;
};

export const createFormattedText = (words, vishraamPositions, options) => {
  return words
    .map((word, index) => {
      const style = getWordStyle(word, index, vishraamPositions, options);
      return style ? `<span style='${style}'>${word}</span>` : word;
    })
    .join(options.isLarivar ? "&#8203;" : " ");
};

export const createParagraphObject = (
  id,
  gurmukhi,
  transliteration,
  englishTranslation,
  punjabiTranslation,
  spanishTranslation,
  header
) => {
  return {
    id: `${id}`,
    gurmukhi,
    translit: transliteration,
    englishTranslations: englishTranslation,
    punjabiTranslations: punjabiTranslation,
    spanishTranslations: spanishTranslation,
    header,
  };
};
