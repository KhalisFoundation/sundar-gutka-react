import constant from "@common/constant";

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
  const hasVishraam = isVishraam && vishraamPositions[index];
  if (hasVishraam) {
    const token = vishraamPositions[index] === "v" ? "vishraamLong" : "vishraamShort";
    if (vishraamOption === constant.VISHRAAM_GRADIENT) {
      style += `border-radius: 5px; background: linear-gradient(to right, transparent 20%, var(--reader-${token}Gradient) 100%);`;
    } else {
      style += `color: var(--reader-${token});`;
    }
  }

  if (isLarivar && isLarivarAssist && index % 2 !== 0) {
    if (!hasVishraam) style += " color: var(--reader-larivaar, inherit);";
    style += " opacity: var(--reader-larivaar-opacity, .65);";
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
