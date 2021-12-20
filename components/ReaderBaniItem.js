import React, { Component } from "react";
import { Text, StyleSheet, View } from "react-native";
import {
  fontSizeForReader,
  fontColorForReader,
  TextType,
} from "../utils/helpers";

class ReaderBaniItem extends Component {
  render() {
    const {
      item,
      nightMode,
      fontSize,
      fontFace,
      englishTranslations,
      transliteration,
      onItemLayout,
    } = this.props;
    return (
      <View style={styles.itemBlock} onLayout={onItemLayout}>
        <Text
          selectable={true}
          style={[
            {
              color: fontColorForReader(
                item.header,
                nightMode,
                TextType.GURMUKHI
              ),
            },
            { fontFamily: fontFace },
            { padding: 5 },
            {
              textAlign:
                item.header === 0
                  ? "left"
                  : item.header === 1 || item.header === 2
                    ? "center"
                    : "right",
            },
            {
              fontSize: fontSizeForReader(fontSize, item.header, false),
            },
          ]}>
          {item.gurmukhi}
        </Text>
        {transliteration && (
          <Text
            style={[
              {
                color: fontColorForReader(
                  item.header,
                  nightMode,
                  TextType.TRANSLITERATION
                ),
              },
              { padding: 5 },
              { fontWeight: item.header === 0 ? "normal" : "bold" },
              {
                textAlign:
                  item.header === 0
                    ? "left"
                    : item.header === 1 || item.header === 2
                      ? "center"
                      : "right",
              },
              {
                fontSize: fontSizeForReader(fontSize, item.header, true),
              },
            ]}>
            {item.translit}
          </Text>
        )}
        {englishTranslations && item.englishTranslations && (
          <Text
            style={[
              {
                color: fontColorForReader(
                  item.header,
                  nightMode,
                  TextType.ENGLISH_TRANSLATION
                ),
              },
              { padding: 5 },
              { fontWeight: item.header === 0 ? "normal" : "bold" },
              {
                textAlign:
                  item.header === 0
                    ? "left"
                    : item.header === 1 || item.header === 2
                      ? "center"
                      : "right",
              },
              {
                fontSize: fontSizeForReader(fontSize, item.header, true),
              },
            ]}>
            {item.englishTranslations}
          </Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  itemBlock: {
    padding: 5,
  },
});

export default ReaderBaniItem;
