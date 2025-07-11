import React from "react";
import PropTypes from "prop-types";
import { View, Text } from "react-native";
import { Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import { constant, STRINGS, colors } from "@common";
import styles from "../styles";

const BaniHeader = (props) => {
  const { navigate } = props;
  const isNightMode = useSelector((state) => state.isNightMode);
  const isDatabaseUpdateAvailable = useSelector((state) => state.isDatabaseUpdateAvaliable);
  return (
    <View
      style={{
        backgroundColor: isNightMode
          ? colors.READER_STATUS_BAR_COLOR_NIGHT_MODE
          : colors.TOOLBAR_COLOR,
      }}
    >
      <View style={styles.fatehContainer}>
        <Text style={styles.headerFatehStyle}>
          <Text style={styles.ikongkar}>{"<>"} </Text>
          {STRINGS.fateh}
        </Text>
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
          name={isDatabaseUpdateAvailable ? "settings-suggest" : "settings"}
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
};
BaniHeader.propTypes = {
  navigate: PropTypes.func.isRequired,
};
export default BaniHeader;
