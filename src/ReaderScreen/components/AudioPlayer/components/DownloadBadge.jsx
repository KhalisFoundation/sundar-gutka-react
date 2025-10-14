import React from "react";
import { View, Text, Pressable } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { DownloadIcon } from "@common/icons";
import { STRINGS } from "@common";
import { downloadBadgeStyles } from "../style";

const DownloadBadge = ({
  currentPlaying,
  isDownloaded,
  isDownloading,
  isAudioEnabled,
  onDownload,
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(downloadBadgeStyles);
  if (!currentPlaying) {
    return null;
  }
  return (
    <View style={styles.container}>
      {!isDownloaded && (
        <Pressable
          onPress={onDownload}
          style={styles.downloadButton}
          disabled={!isAudioEnabled || isDownloading}
        >
          <DownloadIcon size={20} color={theme.colors.primaryHeaderVariant} />
          <Text style={styles.downloadButtonText}>
            {isDownloading ? STRINGS.DOWNLOADING : STRINGS.DOWNLOAD}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

DownloadBadge.propTypes = {
  currentPlaying: PropTypes.shape({}).isRequired,
  isDownloading: PropTypes.bool.isRequired,
  isDownloaded: PropTypes.bool.isRequired,
  isAudioEnabled: PropTypes.bool.isRequired,
  onDownload: PropTypes.func.isRequired,
};

export default DownloadBadge;
