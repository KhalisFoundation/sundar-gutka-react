import constant from "@common/constant";
import { createFormattedText } from "../../../database/utils";
import { createDiv } from "../../../ReaderScreen/utils";
import htmlTemplate from "../../../ReaderScreen/utils/gutkahtml";

// Japji Sahib, first pauri. Text and sttm pause positions come from the bundled
// gutka_v01.db (mv_Banis_Shabad, Bani 2); this is a sample, not a new annotation.
const SAMPLE = {
  legacy: "socY soic n hoveI jy socI lK vwr ]",
  unicode: "ਸੋਚੈ ਸੋਚਿ ਨ ਹੋਵਈ ਜੇ ਸੋਚੀ ਲਖ ਵਾਰ ॥",
  positions: { 0: "y", 3: "v" },
  transliteration: "sochai soch na hoviee je sochee lakh vaar ||",
  translation:
    "Even if one bathes hundreds of thousands of times, the mind does not become cleansed.",
};

const createPreviewHTML = (theme, fontFace, options) => {
  const text = fontFace === constant.BALOO_PAAJI ? SAMPLE.unicode : SAMPLE.legacy;
  const content = createFormattedText(text.split(" "), SAMPLE.positions, {
    ...options,
    isVishraam: true,
  });
  const header = { heading: 1, subheading: 2 }[options.colorKey] || 0;
  let markup = createDiv(
    content,
    header,
    "gurmukhi",
    "center",
    constant.SMALL,
    theme,
    options.isLarivar,
    "",
    fontFace
  );
  if (["transliteration", "translation"].includes(options.colorKey)) {
    markup += createDiv(
      SAMPLE[options.colorKey],
      0,
      options.colorKey,
      "center",
      constant.SMALL,
      theme,
      false
    );
  }
  return htmlTemplate(theme.readerColors.background, fontFace, markup, theme, true);
};

export default createPreviewHTML;
