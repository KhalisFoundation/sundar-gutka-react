import React from "react";
import { Pressable, View, ActivityIndicator } from "react-native";
import { colors, STRINGS, CustomText } from "@common";
import PropTypes from "prop-types";
import styles from "../styles";
// Helper Components

const DownloadControls = ({ downloading, onStartDownload, darkModeText }) => (
  <View style={styles.row}>
    <CustomText style={[styles.label, darkModeText]}>{STRINGS.newVersionAvailable}</CustomText>
    <Pressable
      style={[styles.button, downloading && styles.buttonDisabled]}
      onPress={onStartDownload}
      disabled={downloading}
    >
      {downloading ? (
        <ActivityIndicator color={colors.WHITE_COLOR} />
      ) : (
        <CustomText style={[styles.buttonText, darkModeText]}>{STRINGS.startDownload}</CustomText>
      )}
    </Pressable>
  </View>
);

export default DownloadControls;

DownloadControls.propTypes = {
  downloading: PropTypes.bool.isRequired,
  onStartDownload: PropTypes.func.isRequired,
  darkModeText: PropTypes.shape().isRequired,
};
