import React, { useState } from "react";
import { View, Pressable, Platform, Linking, ActivityIndicator } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { BlurView } from "@react-native-community/blur";
import PropTypes from "prop-types";
import { setDefaultAudio } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { ArrowRightIcon, CloseIcon } from "@common/icons";
import { STRINGS, CustomText } from "@common";
import { useTrackPlayer } from "../hooks";
import { audioTrackDialogStyles } from "../style";
import ScrollViewComponent from "./ScrollViewComponent";

const AudioTrackDialog = ({
  baniID,
  handleTrackSelect,
  title = "",
  tracks = [],
  onCloseTrackModal,
  isHeader = true,
  isFooter = true,
  isLoading = false,
}) => {
  const dispatch = useDispatch();
  const styles = useThemedStyles(audioTrackDialogStyles);
  const fontFace = useSelector((state) => state.fontFace);
  const { theme } = useTheme();
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const { addAndPlayTrack, stop, isPlaying } = useTrackPlayer();

  const handleSelectTrack = async (track) => {
    setSelectedTrack(track);

    if (!isHeader) {
      // If in "no header" mode, just select the track
      handleTrackSelect(track);
      return;
    }

    // If clicking the same track that's playing, stop it
    if (playingTrack && playingTrack.id === track.id && isPlaying) {
      await stop();
      setPlayingTrack(null);
      setSelectedTrack(null);
      return;
    }

    // Otherwise, play the selected track
    try {
      await addAndPlayTrack(track.id, track.audioUrl, track.displayName, track.displayName, true);
      setPlayingTrack(track);
    } catch (error) {
      console.log("Error playing track:", error);
      // Error handling - track play failed
      setPlayingTrack(null);
    }
  };

  const handlePlay = () => {
    if (selectedTrack) {
      handleTrackSelect(selectedTrack);
      dispatch(setDefaultAudio(selectedTrack, baniID));
    }
  };

  const renderScrollViewContent = () => {
    return tracks && tracks.length > 0 ? (
      <ScrollViewComponent
        tracks={tracks}
        selectedTrack={selectedTrack}
        playingTrack={playingTrack}
        isPlaying={isPlaying}
        handleSelectTrack={handleSelectTrack}
      />
    ) : (
      <View style={styles.noTracksContainer}>
        <CustomText style={styles.noTracksText}>{STRINGS.MAAFI_JI}</CustomText>
        <CustomText style={styles.noTracksSubtext}>
          {STRINGS.WE_DO_NOT_HAVE_AUDIOS_FOR}{" "}
          <CustomText
            style={{
              fontFamily: fontFace,
            }}
          >
            {title}
          </CustomText>{" "}
          {STRINGS.YET}.
        </CustomText>
        <Pressable
          style={styles.joinMailingListButton}
          onPress={() =>
            Linking.openURL("https://khalisfoundation.org").catch(() => {
              // Fallback to main website if newsletter link fails
              Linking.openURL("https://khalisfoundation.org");
            })
          }
        >
          <CustomText style={styles.joinMailingListText}>
            {STRINGS.REQUEST_AUDIO_FOR_THIS_PAATH}
          </CustomText>
        </Pressable>
      </View>
    );
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
        <Pressable
          style={styles.closeButton}
          onPress={() => {
            setSelectedTrack(null);
            onCloseTrackModal();
          }}
        >
          <CloseIcon size={30} color={theme.colors.audioTitleText} />
        </Pressable>
        {/* Header */}
        {isHeader && tracks && tracks.length > 0 && (
          <View style={styles.header}>
            <CustomText style={styles.welcomeText}>{STRINGS.welcome_to_sundar_gutka}</CustomText>
            <CustomText style={styles.subtitleText}>
              {STRINGS.please_choose_a_track}{" "}
              <CustomText style={{ fontFamily: fontFace }}>{title}</CustomText>
            </CustomText>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          renderScrollViewContent()
        )}

        {/* Play Button */}
        {isFooter && tracks && tracks.length > 0 && (
          <Pressable
            style={[styles.playButton, !selectedTrack && styles.playButtonDisabled]}
            onPress={handlePlay}
            disabled={!selectedTrack}
            activeOpacity={0.8}
          >
            <CustomText style={styles.playButtonText}>{STRINGS.NEXT}</CustomText>
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
  isLoading: false,
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
  onCloseTrackModal: PropTypes.func.isRequired,
  baniID: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
};

export default AudioTrackDialog;
