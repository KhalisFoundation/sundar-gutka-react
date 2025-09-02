import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { DownloadIcon } from "@common/icons";
import { colors, STRINGS } from "@common";
import { downloadBadgeStyles as styles } from "../style";

const DownloadBadge = ({
  currentPlaying,
  isDownloaded,
  isDownloading,
  isAudioEnabled,
  onDownload,
}) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  if (!currentPlaying) {
    return null;
  }
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isNightMode ? colors.NIGHT_MODE_BLACK : colors.TERTIARY_COLOR },
      ]}
    >
      {!isDownloaded && (
        <Pressable
          onPress={onDownload}
          style={styles.downloadButton}
          disabled={!isAudioEnabled || isDownloading}
        >
          <DownloadIcon
            size={20}
            color={isNightMode ? colors.WHITE_COLOR : colors.READER_HEADER_COLOR}
          />
          <Text
            style={[
              styles.downloadButtonText,
              { color: isNightMode ? colors.WHITE_COLOR : colors.READER_HEADER_COLOR },
            ]}
          >
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
