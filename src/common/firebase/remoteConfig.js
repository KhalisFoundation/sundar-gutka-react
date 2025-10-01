import defaultConfig from "@config/remoteConfig";
import {
  getRemoteConfig,
  setConfigSettings,
  setDefaults,
  fetchAndActivate,
  getValue,
} from "@react-native-firebase/remote-config";

const rc = getRemoteConfig();

export const initRC = async () => {
  try {
    // Dev: 1-min interval; Prod: 12h (43,200,000 ms)
    await setConfigSettings(rc, { minimumFetchIntervalMillis: 43200000 });

    await setDefaults(rc, defaultConfig);

    await fetchAndActivate(rc);
  } catch (error) {
    // Don't throw the error to prevent app crashes
    // The app can continue with default values
  }
};

export const getString = (key) => {
  try {
    if (!key || typeof key !== "string") {
      return defaultConfig[key] ? String(defaultConfig[key]) : "";
    }

    const value = getValue(rc, key);
    const result = value.asString();

    // Return the remote value if it exists and is not empty, otherwise use default
    return result || (defaultConfig[key] ? String(defaultConfig[key]) : "");
  } catch (error) {
    return defaultConfig[key] ? String(defaultConfig[key]) : "";
  }
};

export const getBoolean = (key) => {
  try {
    if (!key || typeof key !== "string") {
      return Boolean(defaultConfig[key]);
    }

    const value = getValue(rc, key);
    const result = value.asBoolean();

    // Return the remote value if it exists, otherwise use default
    return result !== undefined ? result : Boolean(defaultConfig[key]);
  } catch (error) {
    return Boolean(defaultConfig[key]);
  }
};

export const getNumber = (key) => {
  try {
    if (!key || typeof key !== "string") {
      return defaultConfig[key] ? Number(defaultConfig[key]) : 0;
    }

    const value = getValue(rc, key);
    const result = value.asNumber();

    // Return the remote value if it's a valid number, otherwise use default
    if (Number.isNaN(result)) {
      return defaultConfig[key] ? Number(defaultConfig[key]) : 0;
    }
    return result;
  } catch (error) {
    return defaultConfig[key] ? Number(defaultConfig[key]) : 0;
  }
};
