import React from "react";
import { View, Text } from "react-native";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { styles } from "../styles";
import { fontColorForReader, fontSizeForReader } from "../utils/util";
import constant from "../../common/constant";

const commonStyle = (header, isNightMode, type, fontSize, fontFace) => ({
  fontSize: fontSizeForReader(fontSize, header, type !== constant.GURMUKHI),
  color: fontColorForReader(header, isNightMode, type),
  textAlign: header ? "center" : "left",
  fontWeight: header === 0 ? "normal" : "bold",
  fontFamily: type === constant.TRANSLITERATION ? undefined : fontFace,
});

const ShabadItem = React.memo(({ item: tuk }) => {
  const {
    fontFace,
    isNightMode,
    isEnglishTranslation,
    isTransliteration,
    isPunjabiTranslation,
    isSpanishTranslation,
    fontSize,
  } = useSelector((state) => state);

  return (
    <View>
      <Text
        style={[
          styles.gurmukhiText,
          commonStyle(tuk.header, isNightMode, constant.GURMUKHI, fontSize, fontFace),
        ]}
      >
        {tuk.gurmukhi}
      </Text>
      {isTransliteration && (
        <Text
          style={[
            styles.translit,
            commonStyle(tuk.header, isNightMode, constant.TRANSLITERATION, fontSize, fontFace),
          ]}
        >
          {tuk.translit}
        </Text>
      )}
      {isEnglishTranslation && (
        <Text
          style={[
            styles.englishTranslations,
            commonStyle(tuk.header, isNightMode, constant.TRANSLATION, fontSize, fontFace),
          ]}
        >
          {tuk.englishTranslations}
        </Text>
      )}
      {isPunjabiTranslation && (
        <Text
          style={[
            styles.punjabiTranslations,
            commonStyle(tuk.header, isNightMode, constant.TRANSLATION, fontSize, fontFace),
          ]}
        >
          {tuk.punjabiTranslations}
        </Text>
      )}
      {isSpanishTranslation && (
        <Text
          style={[
            styles.spanishTranslations,
            commonStyle(tuk.header, isNightMode, constant.TRANSLATION, fontSize, fontFace),
          ]}
        >
          {tuk.spanishTranslations}
        </Text>
      )}
    </View>
  );
});

ShabadItem.propTypes = {
  item: PropTypes.shape().isRequired,
};
export default ShabadItem;
