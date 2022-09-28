import React from "react";
import { Animated, Easing, Text, Image, Platform, StyleSheet } from "react-native";
import PropTypes from "prop-types";
import { baseFontSize } from "../utils/helpers";
import GLOBAL from "../utils/globals";
import CONSTANT from "../utils/constant";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GLOBAL.COLOR.WHITE_COLOR,
    padding: 16,
    height: 80,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 4,

    ...Platform.select({
      ios: {
        shadowColor: GLOBAL.COLOR.IOS_SHADOW_COLOR,
        shadowOpacity: 1,
        shadowOffset: { height: 2, width: 2 },
        shadowRadius: 2,
      },

      android: {
        elevation: 0,
        marginHorizontal: 30,
      },
    }),
  },
});
class Row extends React.Component {
  constructor(props) {
    super(props);

    this.active = new Animated.Value(0);

    this.style = {
      ...Platform.select({
        ios: {
          transform: [
            {
              scale: this.active.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1],
              }),
            },
          ],
          shadowRadius: this.active.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 10],
          }),
        },

        android: {
          transform: [
            {
              scale: this.active.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.07],
              }),
            },
          ],
          elevation: this.active.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 6],
          }),
        },
      }),
    };
  }

  componentDidUpdate(prevProps) {
    const { active } = this.props;
    if (active !== prevProps.active) {
      Animated.timing(this.active, {
        duration: 800,
        easing: Easing.bounce,
        toValue: Number(active),
        useNativeDriver: true,
      }).start();
    }
  }

  render() {
    const { data, nightMode, transliteration, fontFace } = this.props;

    return (
      <Animated.View
        style={[styles.row, nightMode && { backgroundColor: GLOBAL.COLOR.NIGHT_BLACK }, this.style]}
      >
        {data.folder && <Image source={require("../images/foldericon.png")} style={styles.image} />}

        <Text
          style={[
            { color: nightMode ? GLOBAL.COLOR.WHITE_COLOR : GLOBAL.COLOR.LIGHT_MODE_COLOR },
            !transliteration && { fontFamily: fontFace },
            { fontSize: baseFontSize(CONSTANT.MEDIUM, transliteration) },
          ]}
        >
          {transliteration ? data.translit : data.gurmukhi}
        </Text>
      </Animated.View>
    );
  }
}

Row.propTypes = {
  data: PropTypes.shape().isRequired,
  nightMode: PropTypes.bool.isRequired,
  transliteration: PropTypes.bool.isRequired,
  fontFace: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
};
export default Row;
