import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import styles from "../style";

const DownloadControls = ({
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
    <View style={styles.downloadContainer}>
      {isDownloaded ? (
        <View style={styles.downloadedContainer}>
          <Icon name="check-circle" size={16} color="#28a745" />
          <Text style={styles.downloadedText}>Downloaded</Text>
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Icon name="delete" size={16} color="#dc3545" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onDownload}
          style={styles.downloadButton}
          disabled={!isAudioEnabled || isDownloading}
        >
          <Icon
            name="cloud-download"
            size={16}
            color={isAudioEnabled && !isDownloading ? "#1976d2" : "#ccc"}
          />
          <Text
            style={[
              styles.downloadButtonText,
              { color: isAudioEnabled && !isDownloading ? "#1976d2" : "#ccc" },
            ]}
          >
            {isDownloading ? "Downloading..." : "Download for Offline"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
DownloadControls.propTypes = {
  currentPlaying: PropTypes.shape({}).isRequired,
  isDownloaded: PropTypes.bool.isRequired,
  isDownloading: PropTypes.bool.isRequired,
  isAudioEnabled: PropTypes.bool.isRequired,
  onDownload: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default DownloadControls;
