import { getBoolean, getString } from "@common/firebase/remoteConfig";
import { useMemo } from "react";

const useRemote = () => {
  const values = useMemo(
    () => ({
      IS_AUDIO_FEATURE_ENABLED: getBoolean("IS_AUDIO_FEATURE_ENABLED"),
      REMOTE_DB_URL: getString("REMOTE_DB_URL"),
      REMOTE_AUDIO_API_URL: getString("REMOTE_AUDIO_API_URL"),
      BASIC_AUTH_USERNAME: getString("BASIC_AUTH_USERNAME"),
      BASIC_AUTH_PASSWORD: getString("BASIC_AUTH_PASSWORD"),
    }),
    []
  );
  return { ...values };
};

export default useRemote;
