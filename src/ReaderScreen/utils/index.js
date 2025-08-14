import { Platform } from "react-native";
import { colors, constant, baseFontSize, logError, logMessage } from "@common";
import htmlTemplate from "./gutkahtml";
import script from "./gutkaScript";

export const fontColorForReader = (header, nightMode, text) => {
  const { HEADER_COLOR_1_DARK, HEADER_COLOR_1_LIGHT, WHITE_COLOR, NIGHT_BLACK } = colors;
  const { GURMUKHI, TRANSLATION, TRANSLITERATION } = constant;

  const getHeaderColor1 = () => (nightMode ? HEADER_COLOR_1_DARK : HEADER_COLOR_1_LIGHT);
  const getHeaderColor2 = () => (nightMode ? WHITE_COLOR : NIGHT_BLACK);

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
  isNightMode,
  isLarivaar,
  punjabiTranslation = ""
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
  )}px; color: ${fontColorForReader(header, isNightMode, type.toUpperCase())};">
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
  isNightMode,
  isLarivaar,
  savePosition
) => {
  try {
    const backColor = isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR;
    const fileUri = Platform.select({
      ios: `${fontFace}.ttf`,
      android: `file:///android_asset/fonts/${fontFace}.ttf`,
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
        let contentHtml = `<div id="${item.id}" class='text-item'>`;
        contentHtml += createDiv(
          item.gurmukhi,
          item.header,
          constant.GURMUKHI.toLowerCase(),
          textAlign,
          fontSize,
          isNightMode,
          isLarivaar
        );

        if (isTransliteration) {
          contentHtml += createDiv(
            item.translit,
            item.header,
            constant.TRANSLITERATION.toLowerCase(),
            textAlign,
            fontSize,
            isNightMode,
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
            isNightMode,
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
            isNightMode,
            isLarivaar,
            constant.GURMUKHI.toLowerCase()
          );
        }

        if (isSpanishTranslation) {
          contentHtml += createDiv(
            item.spanishTranslations,
            item.header,
            constant.TRANSLATION.toLowerCase(),
            textAlign,
            fontSize,
            isNightMode,
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
      isNightMode,
      savePosition
    );
    return htmlContent;
  } catch (error) {
    logError(error);
    logMessage("loadHTML: Failed to load HTML");
    throw new Error(error);
  }
};
export { script, htmlTemplate };
