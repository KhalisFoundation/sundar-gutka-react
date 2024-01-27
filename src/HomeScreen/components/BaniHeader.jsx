import React from "react";
import PropTypes from "prop-types";
import { View, Text } from "react-native";
import { Icon } from "@rneui/themed";
import constant from "../../common/constant";
import styles from "../styles";
import STRINGS from "../../common/localization";
import colors from "../../common/colors";

function BaniHeader(props) {
  const { navigate } = props;
  return (
    <View style={styles.header}>
      <View style={styles.fatehContainer}>
        <Text style={styles.headerFatehStyle}>{STRINGS.fateh}</Text>
      </View>
      <View>
        <Text style={styles.titleContainer}>
          <Text style={styles.headerDesign}>Œ</Text>
          <Text style={styles.headerTitle}> {STRINGS.sg_title} </Text>
          <Text style={styles.headerDesign}>‰</Text>
        </Text>
      </View>
      <View style={styles.settingIcon}>
        <Icon
          name="settings"
          type="material"
          size={35}
          color={colors.TOOLBAR_TINT}
          onPress={() => {
            navigate(constant.SETTINGS);
          }}
        />
      </View>
    </View>
  );
}
BaniHeader.propTypes = {
  navigate: PropTypes.func.isRequired,
};
export default BaniHeader;
