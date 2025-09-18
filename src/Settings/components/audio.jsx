import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { toggleAudio, toggleAudioAutoPlay, toggleAudioSyncScroll } from "@common/actions";
import { STRINGS } from "@common";
import { iconNightColor, nightModeStyles, nightModeColor } from "../styles/nightModeStyles";

const Audio = () => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const isAudio = useSelector((state) => state.isAudio);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const dispatch = useDispatch();
  const iconColor = iconNightColor(isNightMode);
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { AUDIO, AUDIO_AUTO_PLAY, AUDIO_SYNC_SCROLL } = STRINGS;

  // Audio settings configuration
  const audioSettings = [
    {
      id: "main",
      title: AUDIO,
      icon: "music-note",
      value: isAudio,
      action: toggleAudio,
      showAlways: true,
    },
    {
      id: "autoPlay",
      title: AUDIO_AUTO_PLAY,
      icon: "play-circle-outline",
      value: isAudioAutoPlay,
      action: toggleAudioAutoPlay,
      showAlways: false,
    },
    {
      id: "syncScroll",
      title: AUDIO_SYNC_SCROLL,
      icon: "sync",
      value: isAudioSyncScroll,
      action: toggleAudioSyncScroll,
      showAlways: false,
    },
  ];

  const renderAudioSetting = (setting) => {
    const shouldShow = setting.showAlways || isAudio;

    if (!shouldShow) return null;

    return (
      <ListItem key={setting.id} bottomDivider containerStyle={containerNightStyles}>
        <Icon color={iconColor} name={setting.icon} type="material" />
        <ListItem.Content>
          <ListItem.Title style={nightColor}>{setting.title}</ListItem.Title>
        </ListItem.Content>
        <Switch
          value={setting.value}
          onValueChange={(value) => {
            dispatch(setting.action(value));
          }}
        />
      </ListItem>
    );
  };

  return <>{audioSettings.map(renderAudioSetting)}</>;
};

export default Audio;
