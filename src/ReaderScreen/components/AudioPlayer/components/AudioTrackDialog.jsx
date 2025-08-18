import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { colors } from "@common";
import { PlayIcon } from "@common/icons";
import { audioTrackDialogStyles as styles } from "../style";

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

            <PlayIcon
              width={24}
              height={24}
              iconColor={
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
