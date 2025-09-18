import React from "react";
import { Pressable, Text } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { PlayIcon } from "@common/icons";
import { colors } from "@common";
import { audioTrackDialogStyles as styles } from "../style";

const TrackItem = ({ track, selectedTrack, handleSelectTrack }) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  return (
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
        color={selectedTrack && selectedTrack.id === track.id ? colors.WHITE_COLOR : "#808fad"}
      />
    </Pressable>
  );
};

TrackItem.propTypes = {
  track: PropTypes.shape({
    id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
  }).isRequired,
  selectedTrack: PropTypes.shape({
    id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
  }).isRequired,
  handleSelectTrack: PropTypes.func.isRequired,
};

export default TrackItem;
