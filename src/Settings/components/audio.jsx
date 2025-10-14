import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { toggleAudio, toggleAudioAutoPlay, toggleAudioSyncScroll } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS } from "@common";
import createStyles from "../styles";

const Audio = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isAudio = useSelector((state) => state.isAudio);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const dispatch = useDispatch();
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
      <ListItem
        key={setting.id}
        bottomDivider
        containerStyle={{ backgroundColor: theme.colors.surfaceGrey }}
      >
        <Icon color={theme.colors.primaryText} name={setting.icon} type="material" />
        <ListItem.Content>
          <ListItem.Title style={styles.listItemTitle}>{setting.title}</ListItem.Title>
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
