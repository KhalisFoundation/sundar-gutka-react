import React from "react";
import { Pressable, View, ActivityIndicator } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, CustomText } from "@common";
import createStyles from "../styles";

const DownloadControls = ({ downloading, onStartDownload, darkModeText }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <CustomText style={[styles.label, darkModeText]}>{STRINGS.newVersionAvailable}</CustomText>
      <Pressable
        style={[styles.button, downloading && styles.buttonDisabled]}
        onPress={onStartDownload}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator color={theme.staticColors.WHITE_COLOR} />
        ) : (
          <CustomText style={[styles.buttonText, darkModeText]}>{STRINGS.startDownload}</CustomText>
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
