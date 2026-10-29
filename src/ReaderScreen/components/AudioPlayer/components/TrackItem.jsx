import React from "react";
import { Pressable } from "react-native";
import PropTypes from "prop-types";
import { PlayIcon } from "@common/icons";
import { CustomText } from "@common";
import { audioTrackDialogStyles } from "../style";
import { useAudioTheme, useAudioThemedStyles } from "../useAudioTheme";

const TrackItem = ({ track, selectedTrack, handleSelectTrack }) => {
  const { theme } = useAudioTheme();
  const styles = useAudioThemedStyles(audioTrackDialogStyles);
  return (
    <Pressable
      key={track.id}
      style={[
        styles.trackItem,
        {
          backgroundColor: theme.c.surfaceSelected,
        },
        selectedTrack && track.id === selectedTrack?.id && styles.selectedTrackItem,
      ]}
      onPress={() => handleSelectTrack(track)}
      activeOpacity={0.7}
    >
      <CustomText
        style={[
          styles.trackName,
          {
            color: theme.c.textPrimary,
          },
          selectedTrack && track.id === selectedTrack.id && styles.selectedTrackName,
        ]}
      >
        {track.displayName}
      </CustomText>

      <PlayIcon
        size={30}
        color={
          selectedTrack && selectedTrack.id === track.id
            ? theme.c.onPrimary
            : theme.c.textBrand
        }
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
