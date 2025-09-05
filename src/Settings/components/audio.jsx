import React, { useState, useEffect } from "react";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { STRINGS, useRemote } from "@common";
import {
  toggleAudio,
  toggleAudioAutoPlay,
  toggleAudioSyncScroll,
  setDefaultAudio,
} from "@common/actions";
import { fetchArtists } from "@service";
import { iconNightColor, nightModeStyles, nightModeColor } from "../styles/nightModeStyles";
import { ListItemComponent, BottomSheetComponent } from "./comon";

const Audio = () => {
  const { BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD, REMOTE_AUDIO_API_URL } = useRemote();
  const [isVisible, toggleVisible] = useState(false);
  const [defaultAudioOptions, setDefaultAudioOptions] = useState([]);
  const [isLoadingArtists, setIsLoadingArtists] = useState(true);
  const isNightMode = useSelector((state) => state.isNightMode);
  const isAudio = useSelector((state) => state.isAudio);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const isAudioSyncScroll = useSelector((state) => state.isAudioSyncScroll);
  const defaultAudio = useSelector((state) => state.defaultAudio);
  const dispatch = useDispatch();
  const iconColor = iconNightColor(isNightMode);
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { AUDIO, AUDIO_AUTO_PLAY, AUDIO_SYNC_SCROLL } = STRINGS;

  // Fetch artists from API
  useEffect(() => {
    const fetchArtistsData = async () => {
      try {
        setIsLoadingArtists(true);
        const options = await fetchArtists(
          BASIC_AUTH_USERNAME,
          BASIC_AUTH_PASSWORD,
          REMOTE_AUDIO_API_URL
        );
        setDefaultAudioOptions(options);
      } catch (error) {
        console.error("Error fetching artists:", error);
      } finally {
        setIsLoadingArtists(false);
      }
    };

    fetchArtistsData();
  }, []);

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

  return (
    <>
      {audioSettings.map(renderAudioSetting)}
      {isAudio && !isLoadingArtists && defaultAudioOptions.length > 0 && (
        <>
          <ListItemComponent
            icon="person"
            isAvatar={false}
            title={STRINGS.DEFAULT_AUDIO}
            value={defaultAudio}
            actionConstant={defaultAudioOptions}
            onPressAction={() => toggleVisible(true)}
          />
          {isVisible && (
            <BottomSheetComponent
              isVisible={isVisible}
              actionConstant={defaultAudioOptions}
              value={defaultAudio}
              toggleVisible={toggleVisible}
              title={STRINGS.DEFAULT_AUDIO}
              action={setDefaultAudio}
            />
          )}
        </>
      )}
    </>
  );
};

export default Audio;
