import { vishraam } from "@theme/palette";
import { constant } from "@common";

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
  // From the palette, not a component theme: this builds a plain HTML style
  // string for the Reader WebView and has no hook context.
  //
  // Reading-theme aware, via CSS custom properties rather than literals. These
  // spans are baked into the markup HERE, at DB-query time, and are NOT
  // regenerated when the reading theme changes — so a literal colour would leave
  // stale vishraam ink on the page until the shabad happened to be refetched.
  // `var()` defers the colour to render time, where gutkahtml's :root block
  // publishes the current theme's values. The fallbacks preserve the original
  // colours for any consumer rendering this markup outside the themed WebView.
  const {
    long: VISHRAM_LONG,
    short: VISHRAM_SHORT,
    longGradient: VISHRAM_LONG_GRADIENT,
    shortGradient: VISHRAM_SHORT_GRADIENT,
  } = vishraam;
  const themedLong = `var(--vishraam-main, ${VISHRAM_LONG})`;
  const themedShort = `var(--vishraam-yamki, ${VISHRAM_SHORT})`;
  const { VISHRAAM_GRADIENT, VISHRAAM_COLORED } = constant;
  if (isVishraam && vishraamPositions[index]) {
    switch (vishraamOption) {
      case VISHRAAM_GRADIENT:
        // var() substitutes textually before the gradient is parsed, so a custom
        // property is valid as a colour stop here.
        style += `border-radius: 5px; background: linear-gradient(to right,rgba(229, 229, 229, 0) 20%, ${
          vishraamPositions[index] === "v"
            ? `var(--vishraam-main-grad, ${VISHRAM_LONG_GRADIENT})`
            : `var(--vishraam-yamki-grad, ${VISHRAM_SHORT_GRADIENT})`
        }`;
        style += "100%);";
        break;
      case VISHRAAM_COLORED:
        style += `color: ${vishraamPositions[index] === "v" ? themedLong : themedShort};`;
        break;
      default:
        style += "color:";
        style += vishraamPositions[index] === "v" ? `${themedLong}` : `${themedShort};`;
        break;
    }
  }

  if (isLarivar && isLarivarAssist && index % 2 !== 0) {
    // Themed through the same custom-property route as the vishraam colours
    // above, and for the same reason: this markup is baked at query time. A
    // low-contrast parchment needs to dim less than a black-on-white page, or
    // the alternate words sink into the paper. The fallback is the original.
    style += " opacity: var(--larivaar-assist, .65);";
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
