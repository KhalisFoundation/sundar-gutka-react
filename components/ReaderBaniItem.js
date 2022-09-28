import React, { PureComponent } from "react";
import { Text, StyleSheet, View } from "react-native";
import PropTypes from "prop-types";
import { fontSizeForReader, fontColorForReader, TextType } from "../utils/helpers";

class ReaderBaniItem extends PureComponent {
  render() {
    const styles = StyleSheet.create({
      itemBlock: {
        padding: 5,
      },
    });
    const {
      item,
      nightMode,
      fontSize,
      fontFace,
      englishTranslations,
      transliteration,
      onItemLayout,
    } = this.props;
    const { header, gurmukhi, translit } = item;
    let textAlign = "";
    switch (header) {
      case 0:
        textAlign = "left";
        break;
      case 1:
        textAlign = "center";
        break;
      case 2:
        textAlign = "center";
        break;
      default:
        textAlign = "right";
    }
    return (
      <View style={styles.itemBlock} onLayout={onItemLayout}>
        <Text
          selectable
          style={[
            {
              color: fontColorForReader(header, nightMode, TextType.GURMUKHI),
            },
            { fontFamily: fontFace },
            { padding: 5 },
            {
              textAlign,
            },
            {
              fontSize: fontSizeForReader(fontSize, header, false),
            },
          ]}
        >
          {gurmukhi}
        </Text>
        {transliteration && (
          <Text
            style={[
              {
                color: fontColorForReader(header, nightMode, TextType.TRANSLITERATION),
              },
              { padding: 5 },
              { fontWeight: header === 0 ? "normal" : "bold" },
              {
                textAlign,
              },
              {
                fontSize: fontSizeForReader(fontSize, header, true),
              },
            ]}
          >
            {translit}
          </Text>
        )}
        {englishTranslations && item.englishTranslations && (
          <Text
            style={[
              {
                color: fontColorForReader(header, nightMode, TextType.ENGLISH_TRANSLATION),
              },
              { padding: 5 },
              { fontWeight: header === 0 ? "normal" : "bold" },
              {
                textAlign,
              },
              {
                fontSize: fontSizeForReader(fontSize, header, true),
              },
            ]}
          >
            {item.englishTranslations}
          </Text>
        )}
      </View>
    );
  }
}
ReaderBaniItem.propTypes = {
  item: PropTypes.shape().isRequired,
  nightMode: PropTypes.bool.isRequired,
  fontSize: PropTypes.string.isRequired,
  fontFace: PropTypes.string.isRequired,
  englishTranslations: PropTypes.bool.isRequired,
  transliteration: PropTypes.bool.isRequired,
  onItemLayout: PropTypes.bool.isRequired,
};

export default ReaderBaniItem;
