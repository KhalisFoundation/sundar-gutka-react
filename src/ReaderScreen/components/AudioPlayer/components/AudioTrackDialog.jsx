import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useSelector } from "react-redux";
import { BlurView } from "@react-native-community/blur";
import PropTypes from "prop-types";
import { ArrowRightIcon } from "@common/icons";
import { colors, STRINGS } from "@common";
import { audioTrackDialogStyles as styles } from "../style";
import ScrollViewComponent from "./ScrollViewComponent";

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
    <View
      style={[
        styles.container,
        { backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.SEMI_TRANSPARENT },
      ]}
    >
      {Platform.OS === "ios" && (
        <BlurView
          style={[
            styles.blurOverlay,
            {
              borderColor: isNightMode ? colors.NIGHT_BLACK : colors.SEMI_TRANSPARENT,
            },
          ]}
          blurType={isNightMode ? "dark" : "light"}
          blurAmount={5}
          reducedTransparencyFallbackColor={isNightMode ? colors.BLACK_COLOR : colors.WHITE_COLOR}
        />
      )}
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
      <ScrollViewComponent
        tracks={tracks}
        selectedTrack={selectedTrack}
        handleSelectTrack={handleSelectTrack}
      />

      {/* Play Button */}
      {isFooter && (
        <Pressable
          style={[styles.playButton, !selectedTrack && styles.playButtonDisabled]}
          onPress={handlePlay}
          disabled={!selectedTrack}
          activeOpacity={0.8}
        >
          <Text style={styles.playButtonText}>{STRINGS.NEXT}</Text>
          <ArrowRightIcon size={24} color={colors.WHITE_COLOR} />
        </Pressable>
      )}
    </View>
  );
};

AudioTrackDialog.defaultProps = {
  title: "",
  isHeader: true,
  isFooter: true,
};

AudioTrackDialog.propTypes = {
  title: PropTypes.string,
  tracks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      selected: PropTypes.bool,
    })
  ).isRequired,
  handleTrackSelect: PropTypes.func.isRequired,
  isHeader: PropTypes.bool,
  isFooter: PropTypes.bool,
};

export default AudioTrackDialog;
