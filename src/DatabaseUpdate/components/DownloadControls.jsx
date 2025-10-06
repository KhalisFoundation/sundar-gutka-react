import React from "react";
import { Text, Pressable, View, ActivityIndicator } from "react-native";
import { STRINGS } from "@common";
import PropTypes from "prop-types";
import useThemedStyles from "@common/hooks/useThemedStyles";
import useTheme from "@common/context";
import createStyles from "../styles";
// Helper Components

const DownloadControls = ({ downloading, onStartDownload, darkModeText }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text style={[styles.label, darkModeText]}>{STRINGS.newVersionAvailable}</Text>
      <Pressable
        style={[styles.button, downloading && styles.buttonDisabled]}
        onPress={onStartDownload}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator color={theme.staticColors.WHITE_COLOR} />
        ) : (
          <Text style={[styles.buttonText, darkModeText]}>{STRINGS.startDownload}</Text>
        )}
      </Pressable>
    </View>
  );
};

export default DownloadControls;

DownloadControls.propTypes = {
  downloading: PropTypes.bool.isRequired,
  onStartDownload: PropTypes.func.isRequired,
  darkModeText: PropTypes.shape().isRequired,
};
