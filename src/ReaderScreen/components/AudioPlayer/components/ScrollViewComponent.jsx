import React from "react";
import { ScrollView, Pressable } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { PlayIcon, StopIcon } from "@common/icons";
import { CustomText } from "@common";
import { audioTrackDialogStyles } from "../style";

const ScrollViewComponent = ({
  tracks,
  selectedTrack = null,
  playingTrack = null,
  isPlaying = false,
  handleSelectTrack,
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(audioTrackDialogStyles);
  return (
    <ScrollView
      style={styles.trackList}
      contentContainerStyle={styles.trackListContent}
      showsVerticalScrollIndicator
      scrollEnabled
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      {tracks.map((track) => (
        <Pressable
          key={track.id}
          style={[
            styles.trackItem,
            {
              backgroundColor: theme.colors.trackBackgroundColor,
              borderColor: theme.mode === "dark" ? theme.staticColors.NIGHT_BLACK : "transparent",
              borderWidth: 1,
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
                color: theme.colors.audioTitleText,
              },
              selectedTrack && track.id === selectedTrack.id && styles.selectedTrackName,
            ]}
          >
            {track.displayName}
          </CustomText>

          {playingTrack && playingTrack.id === track.id && isPlaying ? (
            <StopIcon
              size={30}
              color={
                selectedTrack && selectedTrack.id === track.id
                  ? theme.staticColors.WHITE_COLOR
                  : theme.colors.audioPlayer
              }
            />
          ) : (
            <PlayIcon
              size={30}
              color={
                selectedTrack && selectedTrack.id === track.id
                  ? theme.staticColors.WHITE_COLOR
                  : theme.colors.audioPlayer
              }
            />
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
};

ScrollViewComponent.defaultProps = {
  selectedTrack: null,
  playingTrack: null,
  isPlaying: false,
};

ScrollViewComponent.propTypes = {
  tracks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      displayName: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedTrack: PropTypes.shape({
    id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
  }),
  playingTrack: PropTypes.shape({
    id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
  }),
  isPlaying: PropTypes.bool,
  handleSelectTrack: PropTypes.func.isRequired,
};

export default ScrollViewComponent;
