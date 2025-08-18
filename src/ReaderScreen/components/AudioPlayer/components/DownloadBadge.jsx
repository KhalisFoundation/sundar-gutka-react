import React from "react";
import { View, Text, Pressable } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import PropTypes from "prop-types";
import { DownloadIcon } from "@common/icons";
import { downloadBadgeStyles as styles } from "../style";

const DownloadBadge = ({
  currentPlaying,
  isDownloaded,
  isDownloading,
  isAudioEnabled,
  onDownload,
  onDelete,
}) => {
  if (!currentPlaying) {
    return null;
  }
  return (
    <View style={styles.container}>
      {isDownloaded ? (
        <View style={styles.downloadedContainer}>
          <Icon name="check-circle" size={30} color="#28a745" />
          <Text style={styles.downloadedText}>Downloaded</Text>
          <Pressable onPress={onDelete} style={styles.deleteButton}>
            <Icon name="delete" size={30} color="#dc3545" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onDownload}
          style={styles.downloadButton}
          disabled={!isAudioEnabled || isDownloading}
        >
          <DownloadIcon size={35} color={isAudioEnabled && !isDownloading ? "#1976d2" : "#ccc"} />
          <Text style={[styles.downloadButtonText]}>
            {isDownloading ? "Downloading." : "Download"}
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
  onDelete: PropTypes.func.isRequired,
};

export default DownloadBadge;
