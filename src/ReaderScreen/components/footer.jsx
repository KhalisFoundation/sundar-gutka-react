import React from "react";
import { Animated, Text, Pressable, View } from "react-native";
import { Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { styles, getHeaderStyles } from "../styles";
import { colors } from "../../common";
import { useAnimationHeadFoot } from "../hooks";
import { onPress } from "../utils";

function Footer({ navigation, shabadID }) {
  const { navigate } = navigation;
  const baniList = useSelector((state) => state.baniList);
  const isNightMode = useSelector((state) => state.isNightMode);
  const footerStyle = getHeaderStyles(isNightMode);
  const currentBaniIndex = baniList.findIndex((item) => item.id === shabadID);
  const previousBani = currentBaniIndex !== -1 ? baniList[currentBaniIndex - 1] : null;
  const nextBani = currentBaniIndex !== -1 ? baniList[currentBaniIndex + 1] : null;
  const animationPosition = useAnimationHeadFoot();

  return (
    currentBaniIndex !== -1 && (
      <Animated.View
        style={[
          styles.footerWrapper,
          footerStyle.headerStyle,
          { transform: [{ translateY: animationPosition }] },
        ]}
      >
        {previousBani ? (
          <Pressable
            style={[styles.pressableView]}
            onPress={() => {
              onPress(previousBani, navigate);
            }}
          >
            <View style={{ alignItems: "flex-start" }}>
              <Icon
                name="arrow-back"
                size={30}
                onPress={() => {
                  onPress(previousBani, navigate);
                }}
                color={colors.WHITE_COLOR}
              />
              <Text style={footerStyle.footerTitleStyle}>{previousBani.gurmukhi}</Text>
            </View>
          </Pressable>
        ) : (
          <Text>{}</Text>
        )}

        {nextBani && (
          <Pressable
            style={[styles.pressableView]}
            onPress={() => {
              onPress(nextBani, navigate);
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
