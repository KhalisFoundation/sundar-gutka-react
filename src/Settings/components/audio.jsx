import React from "react";
import { LayoutAnimation, Platform, View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { toggleAudioAutoPlay, toggleAutoDownload, toggleDownloadWifiOnly } from "@common/actions";
import { STRINGS } from "@common";
import SettingsRow, { SettingsToggleRow } from "./comon/SettingsRow";

const Audio = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const autoDownloadOnStream = useSelector((state) => state.autoDownloadOnStream);
  const downloadWifiOnly = useSelector((state) => state.downloadWifiOnly);

  const handleToggleWifiOnly = (value) => {
    if (Platform.OS === "ios") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    dispatch(toggleDownloadWifiOnly(value));
  };

  return (
    <View>
      <SettingsToggleRow
        title={STRINGS.AUDIO_AUTO_PLAY}
        icon="play-circle-outline"
        value={isAudioAutoPlay}
        onValueChange={(value) => dispatch(toggleAudioAutoPlay(value))}
      />

      <SettingsToggleRow
        title={STRINGS.AUTO_DOWNLOAD_ON_STREAM}
        subtitle={STRINGS.AUTO_DOWNLOAD_ON_STREAM_DESC}
        icon="save-alt"
        value={autoDownloadOnStream}
        onValueChange={(value) => dispatch(toggleAutoDownload(value))}
      />

      <SettingsRow
        title={STRINGS.MANAGE_DOWNLOADS}
        icon="file-download"
        onPress={() => navigation.navigate("ManageDownloads")}
      />

      <SettingsToggleRow
        title={STRINGS.DOWNLOAD_WIFI_ONLY}
        subtitle={STRINGS.DOWNLOAD_WIFI_ONLY_DESC}
        icon="wifi"
        value={downloadWifiOnly}
        onValueChange={handleToggleWifiOnly}
      />
    </View>
  );
};

export default Audio;
