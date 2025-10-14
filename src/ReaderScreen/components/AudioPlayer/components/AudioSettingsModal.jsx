import React, { useState } from "react";
import { View, Text, Switch, Pressable } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import {
  toggleAudio,
  toggleAudioAutoPlay,
  toggleAudioSyncScroll,
  setDefaultAudio,
} from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { ChevronRight } from "@common/icons/";
import { audioSettingModalStyles } from "../style";
import ScrollViewComponent from "./ScrollViewComponent";

const AudioSettingsModal = ({ title, tracks, baniID }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(audioSettingModalStyles);
  const isAudio = useSelector((state) => state.isAudio);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(true);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const defaultAudio = useSelector((state) => state.defaultAudio);
  const [isDefaultTrackModalOpen, setIsDefaultTrackModalOpen] = useState(false);
  const dispatch = useDispatch();

  const handleTrackSelect = (track) => {
    dispatch(setDefaultAudio(track, baniID));
    setIsDefaultTrackModalOpen(false);
    setIsSettingsModalOpen(true);
  };
  const settings = [
    {
      title: "Audio Player",
      description: "Audio Player",
      defaultValue: isAudio,
      onValueChange: () => {
        dispatch(toggleAudio(!isAudio));
      },
    },
    {
      title: "Auto Play",
      defaultValue: isAudioAutoPlay,
      onValueChange: () => {
        dispatch(toggleAudioAutoPlay(!isAudioAutoPlay));
      },
    },
    {
      title: "Sync Auto Scroll",
      defaultValue: isAudioSyncScroll,
      onValueChange: () => {
        dispatch(toggleAudioSyncScroll(!isAudioSyncScroll));
      },
    },
  ];
  return (
    <View>
      {isSettingsModalOpen && (
        <View style={styles.settingsModalContainer}>
          {settings.map((setting) => (
            <View key={setting.title} style={styles.modalContainer}>
              <Text style={styles.settingItemTitle}>{setting.title} :</Text>
              {setting.defaultValue !== null ? (
                <Switch
                  value={setting.defaultValue}
                  ios_backgroundColor="#3e3e3e"
                  trackColor={{ false: "#767577", true: theme.colors.primary }}
                  thumbColor={setting.defaultValue ? theme.staticColors.WHITE_COLOR : "#f4f3f4"}
                  style={styles.switchStyle}
                  onValueChange={setting.onValueChange}
                />
              ) : (
                <Text>{setting.value}</Text>
              )}
            </View>
          ))}
          <Pressable
            style={styles.switchContainer}
            onPress={() => {
              setIsDefaultTrackModalOpen(true);
              setIsSettingsModalOpen(false);
            }}
          >
            {defaultAudio[baniID] && defaultAudio[baniID].displayName ? (
              <>
                <Text style={styles.settingItemTitle}>
                  Default Track For <Text style={styles.baniTitle}>{title}</Text>:{" "}
                </Text>

                <View style={styles.defaultTrackContainer}>
                  <Text style={styles.defaultTrackTitle}>{defaultAudio[baniID].displayName} </Text>
                  <ChevronRight size={24} color={theme.colors.primary} />
                </View>
              </>
            ) : (
              <View style={styles.defaultTrackWrapper}>
                <Text style={styles.chooseDefaultTrack}>Choose Default Track</Text>
                <ChevronRight size={24} color={theme.staticColors.WHITE_COLOR} />
              </View>
            )}
          </Pressable>
        </View>
      )}

      {isDefaultTrackModalOpen && (
        <View style={styles.defaultTrackModalContainer}>
          <ScrollViewComponent
            tracks={tracks}
            selectedTrack={defaultAudio[baniID]}
            handleSelectTrack={handleTrackSelect}
          />
        </View>
      )}
    </View>
  );
};

AudioSettingsModal.propTypes = {
  title: PropTypes.string.isRequired,
  tracks: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  baniID: PropTypes.string.isRequired,
};

export default AudioSettingsModal;
