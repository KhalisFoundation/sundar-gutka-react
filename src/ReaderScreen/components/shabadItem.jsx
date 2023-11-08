import React, { useCallback, useState, useEffect } from "react";
import { Text, Pressable, View } from "react-native";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { styles, commonStyle } from "../styles";
import constant from "../../common/constant";
import { setRowHeights } from "../../common/actions";

const ShabadItem = React.memo(({ tuk, index, isHeader, shabadID, toggleIsHeader }) => {
  const {
    fontFace,
    isNightMode,
    isEnglishTranslation,
    isTransliteration,
    isPunjabiTranslation,
    isSpanishTranslation,
    fontSize,
  } = useSelector((state) => state);
  const rowHeights = useSelector((state) => state.rowHeights[shabadID] || []);
  const [heights, setHeights] = useState(rowHeights);
  const dispatch = useDispatch();
  const onItemLayout = useCallback(
    (event) => {
      const { height } = event.nativeEvent.layout;
      // Check if the height has changed
      if (heights[index] !== height) {
        // If the height has changed, dispatch the new height
        const newHeights = [...rowHeights];
        newHeights[index] = height;
        setHeights(newHeights);
      }
    },
    [dispatch, index, rowHeights, shabadID]
  );

  // useEffect(() => {
  //   return () => {
  //     if (heights.length > 0) {
  //       dispatch(setRowHeights(shabadID, heights));
  //     }
  //   };
  // }, [dispatch, heights, shabadID]);

  return (
    <Pressable onPress={() => toggleIsHeader(!isHeader)}>
      {/* <View style={{ height: rowHeight }}> */}
      <View style={{ flex: 1 }} onLayout={(event) => onItemLayout(event, index)}>
        <Text style={[commonStyle(tuk.header, isNightMode, constant.GURMUKHI, fontSize, fontFace)]}>
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
    </Pressable>
  );
});

ShabadItem.propTypes = {
  tuk: PropTypes.shape().isRequired,
  index: PropTypes.number.isRequired,
  isHeader: PropTypes.bool.isRequired,
  shabadID: PropTypes.number.isRequired,
  toggleIsHeader: PropTypes.func.isRequired,
};
export default ShabadItem;
