import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { colors } from "@common";

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    padding: 24,
    // shadowColor: colors.SHADOW_COLOR || "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 10,
    // },
    // shadowOpacity: 0.3,
    // shadowRadius: 20,
    // elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.READER_HEADER_COLOR,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: colors.READER_HEADER_COLOR,
    textAlign: "center",
    opacity: 0.8,
  },
  trackList: {
    maxHeight: 200,
    marginBottom: 24,
  },
  trackItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e5e5e4",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedTrackItem: {
    backgroundColor: colors.READER_HEADER_COLOR,
    borderColor: colors.READER_HEADER_COLOR,
  },
  trackName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.READER_HEADER_COLOR,
    flex: 1,
  },
  selectedTrackName: {
    color: colors.WHITE_COLOR,
  },
  playButton: {
    backgroundColor: colors.READER_HEADER_COLOR,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    minWidth: 120,
  },
  playButtonDisabled: {
    backgroundColor: colors.LIGHT_GRAY || "#f5f5f5",
  },
  playButtonText: {
    color: colors.WHITE_COLOR,
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
  },
});

const AudioTrackDialog = ({ handleTrackSelect, title = "", tracks = [] }) => {
  console.log("tracks", tracks);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const handleSelectTrack = (track) => {
    setSelectedTrack(track);
  };

  const handlePlay = () => {
    if (selectedTrack) {
      handleTrackSelect(selectedTrack);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to Sunder Gutka Audio</Text>
        <Text style={styles.subtitleText}>Please choose a track for {title}</Text>
      </View>

      {/* Track Selection List */}
      <ScrollView style={styles.trackList} showsVerticalScrollIndicator>
        {tracks.map((track) => (
          <Pressable
            key={track.id}
            style={[
              styles.trackItem,
              selectedTrack && track.id === selectedTrack?.id && styles.selectedTrackItem,
            ]}
            onPress={() => handleSelectTrack(track)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.trackName,
                selectedTrack && track.id === selectedTrack.id && styles.selectedTrackName,
              ]}
            >
              {track.displayName}
            </Text>
            <Icon
              name="play-arrow"
              type="material"
              size={24}
              color={
                selectedTrack && selectedTrack.id === track.id ? colors.WHITE_COLOR : "#808fad"
              }
            />
          </Pressable>
        ))}
      </ScrollView>

      {/* Play Button */}
      <Pressable
        style={[styles.playButton, !selectedTrack && styles.playButtonDisabled]}
        onPress={handlePlay}
        disabled={!selectedTrack}
        activeOpacity={0.8}
      >
        <Text style={styles.playButtonText}>Play</Text>
        <Icon name="arrow-forward" type="material" size={20} color={colors.WHITE_COLOR} />
      </Pressable>
    </View>
    // </BlurView>
  );
};

AudioTrackDialog.propTypes = {
  title: PropTypes.string.isRequired,
  tracks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      selected: PropTypes.bool,
    })
  ).isRequired,
  handleTrackSelect: PropTypes.func.isRequired,
};

export default AudioTrackDialog;
