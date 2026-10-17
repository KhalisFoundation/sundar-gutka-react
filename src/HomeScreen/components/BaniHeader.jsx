import React from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import { SettingsIconComponent } from "@common/components";
import { constant, STRINGS, CustomText, useTheme, useThemedStyles, SafeArea } from "@common";
import createStyles from "../styles";

const BaniHeader = ({ navigate }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const kidsEnabled = useSelector((state) => state.kidsMode?.enabled);
  return (
    <SafeArea backgroundColor={theme.colors.primary} edges={["top"]} flex={0}>
      <View
        style={{
          backgroundColor: theme.colors.primary,
        }}
      >
        <View style={styles.fatehContainer}>
          <CustomText style={styles.headerFatehStyle}>
            <CustomText style={styles.ikongkar}>{"<>"} </CustomText>
            {STRINGS.fateh}
          </CustomText>
        </View>
        <View>
          <CustomText style={styles.titleContainer}>
            <CustomText style={styles.headerDesign}>Œ</CustomText>
            <CustomText style={styles.headerTitle}> {STRINGS.sg_title} </CustomText>
            <CustomText style={styles.headerDesign}>‰</CustomText>
          </CustomText>
        </View>
        <View style={styles.settingIcon}>
          <SettingsIconComponent
            size={30}
            handleSettingsPress={() => navigate(constant.SETTINGS)}
            color={theme.staticColors.WHITE_COLOR}
          />
        </View>
        {kidsEnabled && (
          <View style={styles.kidsIcon}>
            <Icon
              name="account-child-outline"
              type="material-community"
              size={30}
              color={theme.staticColors.WHITE_COLOR}
              accessibilityLabel={STRINGS.KIDS_MODE}
              onPress={() => navigate("KidsHome")}
            />
          </View>
        )}
      </View>
    </SafeArea>
  );
};

export default BaniHeader;
BaniHeader.propTypes = {
  navigate: PropTypes.func.isRequired,
};
