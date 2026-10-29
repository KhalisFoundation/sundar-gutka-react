import React, { useMemo } from "react";
import { View, Animated, Pressable } from "react-native";
import { useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import { useReaderTheme } from "@theme/reader";
import PropTypes from "prop-types";
import { useCustomScrollbar } from "@common/components/ScrollIndicator";
import { Spinner } from "@common/components/ui";
import { PlayIcon, StopIcon } from "@common/icons";
import { CustomText, STRINGS } from "@common";
import { audioTrackDialogStyles } from "../style";
import { useAudioTheme, useAudioThemedStyles } from "../useAudioTheme";
import { getLocalTrackPath } from "../utils/audioDownloader";
import PreviewSweep from "./PreviewSweep";

// A track is playable offline when it has a local copy. The authoritative source
// is the download registry (the same store the download button uses), keyed by
// the artist-relative path from the remote URL. The manifest's isLocallyDownloaded
// flag and an already-local audioUrl are accepted as fallbacks.
export const isOfflineAvailable = (track, downloadRegistry) => {
  const url = track?.remoteUrl || track?.audioUrl || "";
  const key = url ? getLocalTrackPath(url) : null;
  return Boolean(
    (key && downloadRegistry?.[key]) ||
      track?.isLocallyDownloaded ||
      (track?.audioUrl && !/^https?:\/\//i.test(track.audioUrl))
  );
};

const byDisplayNameAlpha = (a, b) =>
  (a.displayName || "").localeCompare(b.displayName || "");

const ScrollViewComponent = ({
  tracks,
  selectedTrack = null,
  playingTrack = null,
  isPlaying = false,
  previewLoadingTrackId = null,
  previewActiveTrackId = null,
  previewDurationMs = 0,
  isOffline = false,
  handleSelectTrack,
  header = null,
}) => {
  const { theme } = useAudioTheme();
  const styles = useAudioThemedStyles(audioTrackDialogStyles);
  // The same thumb the Reader's own scrollbar uses, so the two agree.
  const { theme: readerTheme } = useReaderTheme();
  const { scrollViewProps, Indicator } = useCustomScrollbar(readerTheme.scrollbar.thumb);
  const downloadRegistry = useSelector((s) => s.downloadRegistry);

  // Downloaded tracks first (alphabetical), then non-downloaded (alphabetical) —
  // so offline-playable reciters are always easiest to find at the top.
  const { downloadedTracks, nonDownloadedTracks } = useMemo(() => {
    const downloaded = [];
    const nonDownloaded = [];
    tracks.forEach((track) => {
      if (isOfflineAvailable(track, downloadRegistry)) downloaded.push(track);
      else nonDownloaded.push(track);
    });
    downloaded.sort(byDisplayNameAlpha);
    nonDownloaded.sort(byDisplayNameAlpha);
    return { downloadedTracks: downloaded, nonDownloadedTracks: nonDownloaded };
  }, [tracks, downloadRegistry]);

  const renderTrack = (track) => {
    const downloaded = isOfflineAvailable(track, downloadRegistry);
    // Offline + not downloaded → greyed out and non-interactive.
    const unavailableOffline = isOffline && !downloaded;
    const isSelected = selectedTrack && track.id === selectedTrack.id;
    const rightIconColor = isSelected ? theme.c.onPrimary : theme.c.textBrand;
    return (
      <Pressable
        key={track.id}
        style={[
          styles.trackItem,
          {
            backgroundColor: theme.c.accentSubtle,
          },
          selectedTrack && track.id === selectedTrack?.id && styles.selectedTrackItem,
          unavailableOffline && styles.trackItemDisabled,
        ]}
        onPress={() => {
          if (!unavailableOffline) handleSelectTrack(track);
        }}
        disabled={unavailableOffline}
        activeOpacity={0.7}
      >
        {/* Rendered before the name and icons so it paints beneath them. Drives
            itself off the native driver, so the countdown costs this list no
            re-renders while it runs. */}
        {previewActiveTrackId === track.id && (
          <PreviewSweep
            durationMs={previewDurationMs}
            trackStyle={styles.previewSweepTrack}
            fillStyle={styles.previewSweepFill}
          />
        )}

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

        <View style={styles.trackItemRight}>
          {/* Offline tick: shown for already-downloaded tracks, sitting between
            the artist name and the play control. */}
          {downloaded && (
            <Icon
              name="offline-pin"
              type="material"
              size={20}
              color={isSelected ? theme.c.onPrimary : theme.c.textBrand}
            />
          )}
          {previewLoadingTrackId && previewLoadingTrackId === track.id ? (
            <Spinner size="small" color={rightIconColor} />
          ) : playingTrack && playingTrack.id === track.id && isPlaying ? (
            <StopIcon size={30} color={rightIconColor} />
          ) : (
            <PlayIcon size={30} color={rightIconColor} />
          )}
        </View>
      </Pressable>
    );
  };

  // The artist list is inside the audio dialog, which sits on the Reader — so
  // its scrollbar takes the reading theme's thumb like the Reader's own does.
  // The native indicator cannot: Android's comes from a static app resource and
  // iOS offers only default/black/white, which is why passing a colour makes
  // the shared hook draw one on both platforms.
  return (
    <View style={styles.trackListWrapper}>
      <Animated.ScrollView
        // useCustomScrollbar returns a props bag whose shape is its own
        // contract — listing the five keys here would couple this call site to
        // it and go stale. Same spread as the other caller, Settings/index.js.
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...scrollViewProps}
        style={styles.trackList}
        contentContainerStyle={styles.trackListContent}
        nestedScrollEnabled
      >
        {/* The dialog's own intro rides INSIDE this scroller rather than
            sitting above it. Three paragraphs at a raised OS text size are
            taller than the whole card, so as a fixed block above a fixed list
            it pushed the artist rows and the Next button clean off the bottom
            of a card that had no way to scroll to them — leaving the welcome
            line and nothing else. Scrolling with the list, it can be as tall as
            the translation needs and everything below it is still reachable. */}
        {header}
        {downloadedTracks.length > 0 && (
          <>
            <CustomText style={styles.trackSectionHeader}>{STRINGS.DOWNLOADED}</CustomText>
            {downloadedTracks.map(renderTrack)}
          </>
        )}
        {nonDownloadedTracks.length > 0 && (
          <>
            <CustomText style={styles.trackSectionHeader}>{STRINGS.NOT_DOWNLOADED}</CustomText>
            {nonDownloadedTracks.map(renderTrack)}
          </>
        )}
      </Animated.ScrollView>
      {Indicator}
    </View>
  );
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
  previewLoadingTrackId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  previewActiveTrackId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  previewDurationMs: PropTypes.number,
  isOffline: PropTypes.bool,
  handleSelectTrack: PropTypes.func.isRequired,
  /** Rendered above the first row, INSIDE the scroller — see the note there. */
  header: PropTypes.node,
};

export default ScrollViewComponent;
