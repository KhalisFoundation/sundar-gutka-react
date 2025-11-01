import React from "react";
import { Pressable } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { PlayIcon } from "@common/icons";
import { CustomText } from "@common";
import { audioTrackDialogStyles } from "../style";

const TrackItem = ({ track, selectedTrack, handleSelectTrack }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(audioTrackDialogStyles);
  return (
    <Pressable
      key={track.id}
      style={[
        styles.trackItem,
        {
          backgroundColor: theme.colors.overlay,
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
            color: theme.colors.audioPlayer,
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
            ? theme.staticColors.WHITE_COLOR
            : theme.colors.audioPlayer
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
