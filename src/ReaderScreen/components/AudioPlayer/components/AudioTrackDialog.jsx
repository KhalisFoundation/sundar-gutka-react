import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import PropTypes from "prop-types";
import { colors, STRINGS } from "@common";
import { PlayIcon, ArrowRightIcon } from "@common/icons";
import { useSelector } from "react-redux";
import { audioTrackDialogStyles as styles } from "../style";

const AudioTrackDialog = ({
  handleTrackSelect,
  title = "",
  tracks = [],
  isHeader = true,
  isFooter = true,
}) => {
  const [selectedTrack, setSelectedTrack] = useState(null);
  const isNightMode = useSelector((state) => state.isNightMode);
  const handleSelectTrack = (track) => {
    setSelectedTrack(track);
    if (!isHeader) {
      handleTrackSelect(track);
    }
  };

  const handlePlay = () => {
    if (selectedTrack) {
      handleTrackSelect(selectedTrack);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {isHeader && (
        <View style={styles.header}>
          <Text
            style={[
              styles.welcomeText,
              { color: isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR },
            ]}
          >
            {STRINGS.welcome_to_sundar_gutka}
          </Text>
          <Text
            style={[
              styles.subtitleText,
              { color: isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR },
            ]}
          >
            {STRINGS.please_choose_a_track} {title}
          </Text>
        </View>
      )}

      {/* Track Selection List */}
      <ScrollView style={styles.trackList} showsVerticalScrollIndicator>
        {tracks.map((track) => (
          <Pressable
            key={track.id}
            style={[
              styles.trackItem,
              {
                backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.READER_HEADER_COLOR_10,
              },
              selectedTrack && track.id === selectedTrack?.id && styles.selectedTrackItem,
            ]}
            onPress={() => handleSelectTrack(track)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.trackName,
                {
                  color: isNightMode ? colors.AUDIO_PLAYER_NIGHT_ICON : colors.READER_HEADER_COLOR,
                },
                selectedTrack && track.id === selectedTrack.id && styles.selectedTrackName,
              ]}
            >
              {track.displayName}
            </Text>

            <PlayIcon
              size={30}
              color={
                selectedTrack && selectedTrack.id === track.id ? colors.WHITE_COLOR : "#808fad"
              }
            />
          </Pressable>
        ))}
      </ScrollView>

      {/* Play Button */}
      {isFooter && (
        <Pressable
          style={[styles.playButton, !selectedTrack && styles.playButtonDisabled]}
          onPress={handlePlay}
          disabled={!selectedTrack}
          activeOpacity={0.8}
        >
          <Text style={styles.playButtonText}>{STRINGS.PLAY}</Text>
          <ArrowRightIcon size={24} color={colors.WHITE_COLOR} />
        </Pressable>
      )}
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
  isHeader: PropTypes.bool.isRequired,
  isFooter: PropTypes.bool.isRequired,
};

export default AudioTrackDialog;
