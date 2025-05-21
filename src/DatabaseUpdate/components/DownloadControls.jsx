import React from "react";
import { Text, Pressable, View, ActivityIndicator } from "react-native";
import { colors, STRINGS } from "@common";
import PropTypes from "prop-types";
import styles from "../styles";
// Helper Components

const DownloadControls = ({ downloading, onStartDownload, darkModeText }) => (
  <View style={styles.row}>
    <Text style={[styles.label, darkModeText]}>{STRINGS.newVersionAvailable}</Text>
    <Pressable
      style={[styles.button, downloading && styles.buttonDisabled]}
      onPress={onStartDownload}
      disabled={downloading}
    >
      {downloading ? (
        <ActivityIndicator color={colors.WHITE_COLOR} />
      ) : (
        <Text style={[styles.buttonText, darkModeText]}>{STRINGS.startDownload}</Text>
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
