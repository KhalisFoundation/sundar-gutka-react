import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useSelector } from "react-redux";
import { BlurView } from "@react-native-community/blur";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { ArrowRightIcon, CloseIcon } from "@common/icons";
import { STRINGS } from "@common";
import { audioTrackDialogStyles } from "../style";
import ScrollViewComponent from "./ScrollViewComponent";

const AudioTrackDialog = ({
  handleTrackSelect,
  title = "",
  tracks = [],
  isHeader = true,
  isFooter = true,
}) => {
  const styles = useThemedStyles(audioTrackDialogStyles);
  const fontFace = useSelector((state) => state.fontFace);
  const { theme } = useTheme();
  const [selectedTrack, setSelectedTrack] = useState(null);
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
    <View style={styles.modalWrapper}>
      <View
        style={[
          styles.container,
          Platform.OS === "ios" ? styles.containerIOS : styles.containerAndroid,
        ]}
      >
        {Platform.OS === "ios" && (
          <BlurView
            style={styles.blurOverlay}
            blurType={theme.mode === "dark" ? "dark" : "light"}
            blurAmount={10}
            reducedTransparencyFallbackColor={theme.colors.transparentOverlay}
          />
        )}
        <Pressable style={styles.closeButton} onPress={() => setSelectedTrack(null)}>
          <CloseIcon size={30} color={theme.colors.audioTitleText} />
        </Pressable>
        {/* Header */}
        {isHeader && (
          <View style={styles.header}>
            <Text style={styles.welcomeText}>{STRINGS.welcome_to_sundar_gutka}</Text>
            <Text style={styles.subtitleText}>
              {STRINGS.please_choose_a_track} <Text style={{ fontFamily: fontFace }}>{title}</Text>
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
            <ArrowRightIcon size={24} color={theme.staticColors.WHITE_COLOR} />
          </Pressable>
        )}
      </View>
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
