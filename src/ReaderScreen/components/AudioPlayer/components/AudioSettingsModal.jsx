import React, { useEffect } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { toggleAudioAutoPlay, toggleAudioSyncScroll, setAudioPlaybackSpeed } from "@common/actions";
import { Spinner } from "@common/components/ui";
import { PlusIcon, MinusIcon, ChevronRight } from "@common/icons";
import { STRINGS, CustomText, ThemedSwitch, navigate } from "@common";
import { audioSettingModalStyles } from "../style";
import { useAudioTheme, useAudioThemedStyles } from "../useAudioTheme";

const AudioSettingsModal = ({ isLyricsAvailable, isLyricsChecking = false, setRate }) => {
  const { theme } = useAudioTheme();
  const styles = useAudioThemedStyles(audioSettingModalStyles);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const audioPlaybackSpeed = useSelector((state) => state.audioPlaybackSpeed);
  useSelector((state) => state.language); // re-render on language change so STRINGS labels update
  const dispatch = useDispatch();

  const handleSpeedChange = async (value) => {
    if (value < 0.5 || value > 1.6) return;
    dispatch(setAudioPlaybackSpeed(value));
    await setRate(value);
  };

  // Apply saved playback speed on mount
  useEffect(() => {
    if (audioPlaybackSpeed && setRate) {
      setRate(audioPlaybackSpeed);
    }
  }, [audioPlaybackSpeed, setRate]);

  const settings = [
    {
      title: STRINGS.AUDIO_AUTO_PLAY,
      defaultValue: isAudioAutoPlay,
      onValueChange: () => {
        dispatch(toggleAudioAutoPlay(!isAudioAutoPlay));
      },
      disabled: false,
    },
    {
      title: STRINGS.AUDIO_SYNC_SCROLL,
      defaultValue: isAudioSyncScroll,
      onValueChange: () => {
        dispatch(toggleAudioSyncScroll(!isAudioSyncScroll));
      },
      disabled: !isLyricsAvailable,
    },
  ];
  return (
    <ScrollView style={styles.settingsModalContainer}>
      <View>
        {settings.map((setting) => (
          <View key={setting.title}>
            <View style={styles.modalContainer}>
              <CustomText style={styles.settingItemTitle}>{setting.title}</CustomText>
              <View style={styles.settingHelperTextContainer}>
                {setting.disabled && !isLyricsAvailable && !isLyricsChecking ? (
                  <CustomText style={styles.settingHelperText}>
                    {STRINGS.SYNC_UNAVAILABLE}
                  </CustomText>
                ) : setting.disabled && isLyricsChecking ? (
                  <Spinner size="small" color={theme.c.textBrand} />
                ) : (
                  <ThemedSwitch
                    value={setting.defaultValue}
                    onValueChange={setting.onValueChange}
                    disabled={setting.disabled}
                    // Passed explicitly because ThemedSwitch reads useTokens(),
                    // which goes through the APP ThemeContext and never sees the
                    // reading-theme scope this sheet is built from. Without
                    // these the toggles stayed the app's blue on a themed panel.
                    // The thumb takes `surface` — the sheet's own ground — which
                    // is what both tracks are contrast-checked against.
                    onTrackColor={theme.c.controlAccent}
                    offTrackColor={theme.c.controlTrackOff}
                    onThumbColor={theme.c.surface}
                    offThumbColor={theme.c.surface}
                  />
                )}
              </View>
            </View>
            <View style={styles.divider} />
          </View>
        ))}
        <View style={styles.modalContainer}>
          <CustomText style={styles.settingItemTitle}>{STRINGS.PLAYBACK_SPEED}</CustomText>
          <View right style={styles.speedControlContainer}>
            <Pressable
              style={styles.speedControlButton}
              hitSlop={8}
              onPress={() => handleSpeedChange(audioPlaybackSpeed - 0.1)}
              disabled={audioPlaybackSpeed <= 0.5}
            >
              <MinusIcon size={24} color={theme.c.textSecondary} />
            </Pressable>
            <CustomText style={styles.settingValueText}>
              {audioPlaybackSpeed.toFixed(1)}x
            </CustomText>
            <Pressable
              style={styles.speedControlButton}
              hitSlop={8}
              onPress={() => handleSpeedChange(audioPlaybackSpeed + 0.1)}
              disabled={audioPlaybackSpeed > 1.6}
            >
              <PlusIcon size={24} color={theme.c.textSecondary} />
            </Pressable>
          </View>
        </View>
        {/* Jump to the Manage Downloads screen — moved here from the track
            picker footer. Navigates above the Reader; the audio overlay stays
            mounted so Back returns to the player. */}
        <View style={styles.divider} />
        <Pressable style={styles.modalContainer} onPress={() => navigate("ManageDownloads")}>
          <CustomText style={styles.settingItemTitle}>{STRINGS.MANAGE_DOWNLOADS}</CustomText>
          <ChevronRight size={22} color={theme.c.textSecondary} />
        </Pressable>
      </View>
    </ScrollView>
  );
};

AudioSettingsModal.propTypes = {
  isLyricsAvailable: PropTypes.bool.isRequired,
  isLyricsChecking: PropTypes.bool,
  setRate: PropTypes.func.isRequired,
};

export default AudioSettingsModal;
