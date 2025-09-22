import React from "react";
import { ScrollView, Pressable, Text } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { PlayIcon } from "@common/icons";
import { colors } from "@common";
import { audioTrackDialogStyles as styles } from "../style";

const ScrollViewComponent = ({ tracks, selectedTrack = null, handleSelectTrack }) => {
  const isNightMode = useSelector((state) => state.isNightMode);
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
              backgroundColor: isNightMode
                ? colors.REAder_HEADER_COLOR_10
                : colors.READER_HEADER_COLOR_10,
              borderColor: isNightMode ? colors.NIGHT_MODE_BLACK : "transparent",
              borderWidth: 1,
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
      ))}
    </ScrollView>
  );
};

ScrollViewComponent.defaultProps = {
  selectedTrack: null,
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
  handleSelectTrack: PropTypes.func.isRequired,
};

export default ScrollViewComponent;
