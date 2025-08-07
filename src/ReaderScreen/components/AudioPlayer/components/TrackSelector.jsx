import React from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import styles from "../style";

const TrackSelector = ({ visible, onClose, tracks, currentPlaying, onTrackSelect, isLoading }) => {
  if (!tracks || tracks.length === 0) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Track</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.trackList}>
            {tracks && tracks.length > 0 ? (
              tracks.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={[
                    styles.trackItem,
                    currentPlaying?.id === track.id && styles.selectedTrackItem,
                  ]}
                  onPress={() => onTrackSelect(track)}
                  disabled={isLoading}
                >
                  <View style={styles.trackItemContent}>
                    <Text style={styles.trackItemTitle}>{track.displayName}</Text>
                    {currentPlaying?.id === track.id && (
                      <Icon name="check-circle" size={20} color="#1976d2" />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noTracksText}>No tracks available</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

TrackSelector.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  tracks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      displayName: PropTypes.string.isRequired,
    })
  ).isRequired,
  currentPlaying: PropTypes.shape({
    id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
  }).isRequired,
  onTrackSelect: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default TrackSelector;
