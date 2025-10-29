import React, { useEffect } from "react";
import { View, Text, Switch, ScrollView, Pressable } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import {
  toggleAudio,
  toggleAudioAutoPlay,
  toggleAudioSyncScroll,
  setAudioPlaybackSpeed,
} from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { PlusIcon, MinusIcon } from "@common/icons";
import { useTrackPlayer } from "../hooks";
import { audioSettingModalStyles } from "../style";

const AudioSettingsModal = ({ isLyricsAvailable }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(audioSettingModalStyles);
  const isAudio = useSelector((state) => state.isAudio);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const audioPlaybackSpeed = useSelector((state) => state.audioPlaybackSpeed);
  const dispatch = useDispatch();
  const { setRate } = useTrackPlayer();

  const handleSpeedChange = async (value) => {
    if (value < 1.0 || value > 2.0) return;
    dispatch(setAudioPlaybackSpeed(value));
    await setRate(value);
  };

  // Apply saved playback speed on mount
  useEffect(() => {
    if (audioPlaybackSpeed && setRate) {
      setRate(audioPlaybackSpeed);
    }
  }, []);

  const settings = [
    {
      title: "Audio Player",
      description: "Audio Player",
      defaultValue: isAudio,
      onValueChange: () => {
        dispatch(toggleAudio(!isAudio));
      },
      disabled: false,
    },
    {
      title: "Auto Play",
      defaultValue: isAudioAutoPlay,
      onValueChange: () => {
        dispatch(toggleAudioAutoPlay(!isAudioAutoPlay));
      },
      disabled: false,
    },
    {
      title: "Sync Auto Scroll",
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
              <Text style={styles.settingItemTitle}>{setting.title}</Text>
              <View>
                <Switch
                  value={setting.defaultValue}
                  ios_backgroundColor="#3e3e3e"
                  trackColor={{ false: "#767577", true: theme.colors.primary }}
                  thumbColor={setting.defaultValue ? theme.staticColors.WHITE_COLOR : "#f4f3f4"}
                  style={styles.switchStyle}
                  onValueChange={setting.onValueChange}
                  disabled={setting.disabled}
                />
              </View>
            </View>
            <View style={styles.divider} />
          </View>
        ))}
        <View style={styles.modalContainer}>
          <Text style={styles.settingItemTitle}>Playback Speed</Text>
          <View right style={styles.speedControlContainer}>
            <Pressable
              onPress={() => handleSpeedChange(audioPlaybackSpeed + 0.1)}
              disabled={audioPlaybackSpeed > 2.0}
            >
              <PlusIcon size={24} color={theme.colors.audioSettingsModalText} />
            </Pressable>
            <Text style={styles.settingItemTitle}>{audioPlaybackSpeed.toFixed(1)}x</Text>
            <Pressable
              onPress={() => handleSpeedChange(audioPlaybackSpeed - 0.1)}
              disabled={audioPlaybackSpeed < 1.0}
            >
              <MinusIcon size={24} color={theme.colors.audioSettingsModalText} />
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

AudioSettingsModal.propTypes = {
  isLyricsAvailable: PropTypes.bool.isRequired,
};

export default AudioSettingsModal;
