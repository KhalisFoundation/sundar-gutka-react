import React, { useState } from "react";
import { View, Text, Switch, Pressable } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  toggleAudio,
  toggleAudioAutoPlay,
  toggleAudioSyncScroll,
  setDefaultAudio,
} from "@common/actions";
import PropTypes from "prop-types";
import { colors } from "@common";
import { ChevronRight } from "@common/icons/";
import AudioTrackDialog from "./AudioTrackDialog";
import { audioSettingModalStyles as styles } from "../style";

const AudioSettingsModal = ({ title, tracks, baniID }) => {
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
        <View>
          {settings.map((setting) => (
            <View key={setting.title} style={styles.modalContainer}>
              <Text style={styles.settingItemTitle}>{setting.title} :</Text>
              {setting.defaultValue !== null ? (
                <Switch
                  value={setting.defaultValue}
                  ios_backgroundColor="#3e3e3e"
                  trackColor={{ false: "#767577", true: colors.READER_HEADER_COLOR }}
                  thumbColor={setting.defaultValue ? colors.WHITE_COLOR : "#f4f3f4"}
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
            <Text style={styles.settingItemTitle}>
              Default Track For <Text style={styles.baniTitle}>{title}</Text>:{" "}
            </Text>
            {defaultAudio[baniID] && defaultAudio[baniID].displayName && (
              <View style={styles.defaultTrackContainer}>
                <Text style={styles.defaultTrackTitle}>{defaultAudio[baniID].displayName} </Text>
                <ChevronRight size={24} color={colors.READER_HEADER_COLOR} />
              </View>
            )}
          </Pressable>
        </View>
      )}

      {isDefaultTrackModalOpen && (
        <AudioTrackDialog
          tracks={tracks}
          isHeader={false}
          isFooter={false}
          handleTrackSelect={handleTrackSelect}
        />
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
