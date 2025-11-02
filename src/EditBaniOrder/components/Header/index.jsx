import React, { useCallback } from "react";
import { View, Pressable } from "react-native";
import PropTypes from "prop-types";
import { BackIconComponent } from "@common/components";
import { RefreshIcon } from "@common/icons";
import { STRINGS, CustomText, useTheme, useThemedStyles } from "@common";
import createStyles from "./styles";

const Header = ({ navigation, setReset }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { goBack } = navigation;
  const { EDIT_BANI_ORDER } = STRINGS;

  const headerLeft = useCallback(
    () => (
      <BackIconComponent
        size={30}
        handleBackPress={() => goBack()}
        color={theme.staticColors.WHITE_COLOR}
      />
    ),
    [goBack, theme.staticColors.WHITE_COLOR]
  );

  const headerRight = useCallback(
    () => (
      <Pressable onPress={() => setReset(true)}>
        <RefreshIcon size={30} color={theme.staticColors.WHITE_COLOR} />
      </Pressable>
    ),
    [setReset, theme.staticColors.WHITE_COLOR]
  );

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>{headerLeft()}</View>
      <CustomText style={styles.title}>{EDIT_BANI_ORDER}</CustomText>
      <View style={styles.rightContainer}>{headerRight()}</View>
    </View>
  );
};

Header.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  setReset: PropTypes.func.isRequired,
};

export default Header;
