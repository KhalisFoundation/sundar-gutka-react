import React from "react";
import { Text } from "react-native";
import baseFontSize from "../../common/helpers";
import constant from "../../common/constant";
import colors from "../../common/colors";
import { styles } from "../styles/styles";

export const fontColorForReader = (header, nightMode, text) => {
  const { HEADER_COLOR_1_DARK, HEADER_COLOR_1_LIGHT, HEADER_COLOR_2_LIGHT, SLIDER_TRACK_MIN_TINT } =
    colors;

  const getHeaderColor1 = () => (nightMode ? HEADER_COLOR_1_DARK : HEADER_COLOR_1_LIGHT);
  const getHeaderColor2 = () => (nightMode ? SLIDER_TRACK_MIN_TINT : HEADER_COLOR_2_LIGHT);

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

export const convertToParagraph = (data) => {
  const paragraphResult = data.reduce((accumulator, currentvalue) => {
    const {
      gurmukhi,
      paragraph,
      englishTranslations,
      punjabiTranslations,
      spanishTranslations,
      translit,
    } = currentvalue;

    const lastTuk = accumulator[accumulator.length - 1];

    if (lastTuk && lastTuk.paragraph === paragraph) {
      lastTuk.englishTranslations += englishTranslations;
      lastTuk.punjabiTranslations += punjabiTranslations;
      lastTuk.spanishTranslations += spanishTranslations;
      lastTuk.translit += translit;
      lastTuk.gurmukhi = [...lastTuk.gurmukhi, gurmukhi];
    } else {
      currentvalue.gurmukhi = [currentvalue.gurmukhi];
      accumulator.push({ ...currentvalue });
    }
    return accumulator;
  }, []);

  return paragraphResult;
};

export const processData = (
  data,
  isVishraam,
  isLarivaar,
  isLarivaarAssist,
  vishraamSource,
  vishraamOption
) => {
  const shabad = data.map((pankti) => {
    const { gurmukhi, visramDB, id } = pankti;
    const wordsArray = String(gurmukhi).split(" ");
    const vishramJson = visramDB ? JSON.parse(visramDB) : null;
    let vishramPositions = {};

    if (isVishraam && vishramJson && vishramJson[vishraamSource]) {
      vishramPositions = vishramJson[vishraamSource].reduce((accumulator, pos) => {
        return { ...accumulator, [pos.p]: pos.t };
      }, {});
    }

    const isVishramBasic = vishraamOption === constant.VISHRAAM_COLORED;
    const larivaarAssist = isLarivaar && isLarivaarAssist;

    const tuk = (
      <Text key={id}>
        {wordsArray.map((word, index) => {
          const isBasic = isVishramBasic && vishramPositions[index] === "v";
          const isShort = isVishramBasic && vishramPositions[index] === "y";
          const isAssist = larivaarAssist && index % 2 !== 0;

          const textStyles = [
            isBasic && styles.vishramBasic,
            isShort && styles.vishramShort,
            isAssist && styles.larivaarAssist,
          ];

          return (
            <React.Fragment key={`${index} ${word}  ${id}`}>
              <Text style={textStyles}>{word}</Text>
              {!isLarivaar && <Text>&nbsp;</Text>}
            </React.Fragment>
          );
        })}
      </Text>
    );
    return {
      ...pankti,
      gurmukhi: tuk,
    };
  });
  return shabad;
};
