import React from "react";
import { View, Text } from "react-native";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { styles, commonStyle } from "../styles";
import constant from "../../common/constant";

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
