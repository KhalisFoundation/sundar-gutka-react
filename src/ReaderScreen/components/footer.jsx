import React from "react";
import { Animated, Text, Pressable, View } from "react-native";
import { Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { styles, getHeaderStyles } from "../styles";
import { colors, constant } from "../../common";
import { useAnimationHeadFoot } from "../hooks";

function Footer({ navigation, shabadID }) {
  const { navigate } = navigation;
  const baniList = useSelector((state) => state.baniList);
  const isNightMode = useSelector((state) => state.isNightMode);
  const footerStyle = getHeaderStyles(isNightMode);
  const currentBaniIndex = baniList.findIndex((item) => item.id === shabadID);
  const previousBani = currentBaniIndex !== -1 ? baniList[currentBaniIndex - 1] : null;
  const nextBani = currentBaniIndex !== -1 ? baniList[currentBaniIndex + 1] : null;
  const animationPosition = useAnimationHeadFoot();

  function onPress(bani) {
    if (!bani.folder) {
      navigate(constant.READER, {
        key: `Reader-${bani.id}`,
        params: { id: bani.id, title: bani.gurmukhi },
      });
    } else {
      navigate(constant.FOLDERSCREEN, {
        key: `Folder-${bani.gurmukhi}`,
        params: { data: bani.folder, title: bani.gurmukhi },
      });
    }
  }
  return (
    currentBaniIndex !== -1 && (
      <Animated.View
        style={[
          styles.footerWrapper,
          footerStyle.headerStyle,
          { transform: [{ translateY: animationPosition }] },
        ]}
      >
        {previousBani && (
          <Pressable
            style={[styles.pressableView]}
            onPress={() => {
              onPress(previousBani);
            }}
          >
            <View style={{ alignItems: "flex-start" }}>
              <Icon
                name="arrow-back"
                size={30}
                onPress={() => {
                  onPress(previousBani);
                }}
                color={colors.WHITE_COLOR}
              />
              <Text style={footerStyle.footerTitleStyle}>{previousBani.gurmukhi}</Text>
            </View>
          </Pressable>
        )}

        {nextBani && (
          <Pressable
            style={[styles.pressableView]}
            onPress={() => {
              onPress(nextBani);
            }}
          >
            <View style={{ alignItems: "flex-end" }}>
              <Icon name="arrow-forward" size={30} color={colors.WHITE_COLOR} />
              <Text style={footerStyle.footerTitleStyle}>{nextBani.gurmukhi}</Text>
            </View>
          </Pressable>
        )}
      </Animated.View>
    )
  );
}

Footer.propTypes = {
  shabadID: PropTypes.number.isRequired,
  navigation: PropTypes.shape().isRequired,
};
export default Footer;
