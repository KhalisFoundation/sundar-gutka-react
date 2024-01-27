import React, { useEffect, useState } from "react";
import { View, Text, Animated } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import colors from "../../common/colors";
import { getHeaderStyles, styles } from "../styles/styles";

const Header = React.forwardRef(
  ({ navigation, title, handleBackPress, handleBookmarkPress, handleSettingsPress }, ref) => {
    const isNightMode = useSelector((state) => state.isNightMode);
    const getHeaderStyle = getHeaderStyles(isNightMode);
    const [animationPosition] = useState(new Animated.Value(0));

    const headerLeft = () => {
      return (
        <Icon
          name="arrow-back"
          size={30}
          onPress={() => {
            handleBackPress();
          }}
          color={colors.WHITE_COLOR}
        />
      );
    };
    const headerRight = () => {
      return (
        <View style={{ flexDirection: "row" }}>
          <Icon
            name="bookmark"
            color={colors.TOOLBAR_TINT}
            size={30}
            onPress={handleBookmarkPress}
          />
          <Icon
            name="settings"
            color={colors.TOOLBAR_TINT}
            size={30}
            onPress={() => handleSettingsPress()}
          />
        </View>
      );
    };

    useEffect(() => {
      navigation.setOptions({
        headerShown: false,
      });
    });
    const toggleHeader = (isHeader) => {
      const value = isHeader ? 0 : -120;
      Animated.timing(animationPosition, {
        toValue: value,
        duration: 500,
        // easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    };

    React.useImperativeHandle(ref, () => ({
      toggle: toggleHeader,
    }));

    return (
      <Animated.View
        style={[
          styles.animatedView,
          {
            transform: [{ translateY: animationPosition }],
          },
        ]}
      >
        <View style={getHeaderStyle.headerStyle}>
          <View style={styles.headerWrapper}>
            {headerLeft()}
            <Text style={getHeaderStyle.headerTitleStyle}>{title}</Text>
            {headerRight()}
          </View>
        </View>
      </Animated.View>
    );
  }
);

Header.propTypes = {
  navigation: PropTypes.shape().isRequired,
  title: PropTypes.string.isRequired,
  handleBackPress: PropTypes.func.isRequired,
  handleBookmarkPress: PropTypes.func.isRequired,
  handleSettingsPress: PropTypes.func.isRequired,
};
export default Header;
