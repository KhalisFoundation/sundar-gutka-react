import { Platform } from "react-native";
import { constant, baseFontSize, logError, logMessage } from "@common";
import htmlTemplate from "./gutkahtml";
import script from "./gutkaScript";

export const fontColorForReader = (header, theme, text) => {
  const { GURMUKHI, TRANSLATION, TRANSLITERATION } = constant;

  const getHeaderColor1 = () => theme.colors.primaryHeaderVariant;
  const getHeaderColor2 = () => theme.colors.primaryText;

  const defaultColor = getHeaderColor2();
  const gurmukhiMapping = {
    1: getHeaderColor1(),
    2: getHeaderColor1(),
    6: defaultColor,
    default: defaultColor,
  };

  const colorMapping = {
    [GURMUKHI]: gurmukhiMapping,
    [TRANSLITERATION]: getHeaderColor1(),
    [TRANSLATION]: defaultColor,
  };

  const color = colorMapping[text];
  if (typeof color === "object") {
    return color[header] || color.default;
  }

  return color || null;
};

export const fontSizeForReader = (fontSizeString, headerLevel, hasTransliteration) => {
  const SCALE_FACTOR = 0.9;
  const fontSize = baseFontSize(fontSizeString, hasTransliteration) * SCALE_FACTOR;
  switch (headerLevel) {
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

export const createDiv = (
  content,
  header,
  type,
  textAlign,
  fontSize,
  theme,
  isLarivaar,
  punjabiTranslation = "",
  fontFace = null
) => {
  const fontClass =
    type === constant.GURMUKHI.toLowerCase() || punjabiTranslation !== ""
      ? constant.GURMUKHI.toLowerCase()
      : type;
  return `
    <div class="content-item ${fontClass} ${textAlign}" style="font-size: ${fontSizeForReader(
    fontSize,
    header,
    type === constant.TRANSLITERATION.toLowerCase() || type === constant.TRANSLATION.toLowerCase()
  )}px; font-family: ${fontFace}; color: ${fontColorForReader(header, theme, type.toUpperCase())};">
      ${content}
    </div>
  `;
};

export const loadHTML = (
  shabad,
  isTransliteration,
  fontSize,
  fontFace,
  isEnglishTranslation,
  isPunjabiTranslation,
  isSpanishTranslation,
  theme,
  isLarivaar,
  savePosition
) => {
  try {
    const backColor = theme.colors.surface;
    const fileUri = Platform.select({
      ios: `${fontFace}.ttf`,
      android: `file:///android_asset/fonts/${fontFace}.ttf`,
    });
    const defaultFontFaceURI = Platform.select({
      ios: `${constant.GURBANI_AKHAR_TRUE}.ttf`,
      android: `file:///android_asset/fonts/${constant.GURBANI_AKHAR_TRUE}.ttf`,
    });

    const content = shabad
      .map((item) => {
        const textAlignMap = {
          0: "left",
          1: "left",
          2: "left",
        };

        let textAlign = textAlignMap[item.header];
        if (textAlign === undefined) {
          textAlign = "right";
        }
        // Use pipe delimiters for easy CSS selector matching
        const paragraphId = item.sequences ? item.sequences[0] : item.sequence;
        const sequencesData = item.sequences
          ? ` data-sequences='|${item.sequences.join("|")}|'`
          : ` scroll-sequence='${paragraphId}'`;
        let contentHtml = `<div id="${item.id}" class='text-item'${sequencesData}>`;
        contentHtml += createDiv(
          fontFace === constant.BALOO_PAAJI ? item.gurmukhiUni : item.gurmukhi,
          item.header,
          constant.GURMUKHI.toLowerCase(),
          textAlign,
          fontSize,
          theme,
          isLarivaar,
          "",
          fontFace
        );

        if (isTransliteration) {
          contentHtml += createDiv(
            item.translit,
            item.header,
            constant.TRANSLITERATION.toLowerCase(),
            textAlign,
            fontSize,
            theme,
            isLarivaar
          );
        }

        if (isEnglishTranslation) {
          contentHtml += createDiv(
            item.englishTranslations,
            item.header,
            constant.TRANSLATION.toLowerCase(),
            textAlign,
            fontSize,
            theme,
            isLarivaar
          );
        }

        if (isPunjabiTranslation) {
          contentHtml += createDiv(
            item.punjabiTranslations,
            item.header,
            constant.TRANSLATION.toLowerCase(),
            textAlign,
            fontSize,
            theme,
            isLarivaar,
            constant.GURMUKHI.toLowerCase(),
            constant.GURBANI_AKHAR_TRUE
          );
        }

        if (isSpanishTranslation) {
          contentHtml += createDiv(
            item.spanishTranslations,
            item.header,
            constant.TRANSLATION.toLowerCase(),
            textAlign,
            fontSize,
            theme,
            isLarivaar
          );
        }

        contentHtml += `</div>`;
        return contentHtml;
      })
      .join("");
    const htmlContent = htmlTemplate(
      backColor,
      fileUri,
      fontFace,
      content,
      theme,
      savePosition,
      defaultFontFaceURI
    );

    console.log("htmlContent", htmlContent);
    return htmlContent;
  } catch (error) {
    logError(error);
    logMessage("loadHTML: Failed to load HTML");
    throw new Error(error);
  }
};
export { script, htmlTemplate };
