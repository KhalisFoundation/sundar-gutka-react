import React from "react";
import { View, Pressable } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  SafeArea,
  StatusBarComponent,
  CustomText,
  useTheme,
  useThemedStyles,
  STRINGS,
} from "@common";
import { BackArrowIcon } from "@common/icons";
import createStyles from "./styles";

const DashboardScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  useSelector((state) => state.language);

  const handleBackPress = () => {
    navigation.navigate("Home");
  };

  return (
    <SafeArea backgroundColor={theme.colors.surface} edges={["left", "right"]}>
      <StatusBarComponent backgroundColor={theme.colors.primary} />
      <SafeArea backgroundColor={theme.colors.primary} edges={["top"]} flex={0}>
        <View style={styles.header}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <BackArrowIcon size={25} color={theme.staticColors.WHITE_COLOR} />
          </Pressable>
          <CustomText style={styles.headerTitle}>
            {STRINGS.DASHBOARD}
          </CustomText>
          <View style={styles.headerSpacer} />
        </View>
      </SafeArea>
      <View
        style={[{ backgroundColor: theme.colors.surface }, styles.container]}
      >
        <CustomText style={styles.title}>{STRINGS.DASHBOARD}</CustomText>
        <CustomText style={styles.subtitle}>{STRINGS.COMING_SOON}</CustomText>
      </View>
    </SafeArea>
  );
};

DashboardScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired })
    .isRequired,
};

export default DashboardScreen;
