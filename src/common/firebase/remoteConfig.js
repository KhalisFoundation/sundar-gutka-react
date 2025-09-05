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
  await setConfigSettings(rc, { minimumFetchIntervalMillis: 43200000 });

  await setDefaults(rc, defaultConfig);

  await fetchAndActivate(rc);
};

export const getString = (key) => {
  const value = getValue(rc, key);
  return value.asString() || String(defaultConfig[key]);
};
export const getBoolean = (key) => {
  const value = getValue(rc, key);
  return value.asBoolean() || Boolean(defaultConfig[key]);
};

export const getNumber = (key) => {
  const value = getValue(rc, key);
  return value.asNumber() || Number(defaultConfig[key]);
};
