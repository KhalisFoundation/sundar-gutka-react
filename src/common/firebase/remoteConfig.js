import {
  getRemoteConfig,
  setConfigSettings,
  setDefaults,
  fetchAndActivate,
  getValue,
} from "@react-native-firebase/remote-config";
import defaultConfig from "@config/remoteConfig";

const rc = getRemoteConfig();

export const initRC = async () => {
  // Dev: 1-min interval; Prod: 12h (43,200,000 ms)
  await setConfigSettings(rc, { minimumFetchIntervalMillis: 60000 });

  await setDefaults(rc, defaultConfig);

  const activated = await fetchAndActivate(rc);
  console.log("activated", activated);
};

// Read values
export const audioEnabled = () => {
  const value = getValue(rc, "audio_enabled");
  return {
    isAudioEnabled: value.asBoolean(),
    location: value.getSource(),
  };
};
