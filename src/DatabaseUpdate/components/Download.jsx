import React, { useEffect, useRef, useState, useMemo } from "react";
import { Text, Animated, View } from "react-native";
import { downloadFile, exists, unlink, moveFile } from "react-native-fs";
import {
  logMessage,
  logError,
  actions,
  checkForBaniDBUpdate,
  LOCAL_DB_PATH,
  writeRemoteMD5Hash,
  getCurrentDBMD5Hash,
  STRINGS,
  useRemote,
  constant,
} from "@common";
import { useDispatch, useSelector } from "react-redux";
import initDB, { closeDatabase } from "../../database/connect";
import styles from "../styles";
import { darkMode } from "./styles";
import DownloadAnimation from "./DownloadAnimation";
import { revertMD5Hash } from "../../common/rnfs";
import DownloadControls from "./DownloadControls";

const DownloadComponent = () => {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isNightMode = useSelector((state) => state.isNightMode);
  const { darkModeContainer, darkModeText } = useMemo(() => darkMode(isNightMode), [isNightMode]);
  const dispatch = useDispatch();
  const { REMOTE_DB_URL } = useRemote();

  // keep text % in sync with the animated value
  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => {
      setProgress(Math.floor(value));
    });
    return () => progressAnim.removeListener(id);
  }, [progressAnim]);

  const startDownload = async () => {
    if (downloading) {
      return;
    }
    const currentMD5Hash = await getCurrentDBMD5Hash();
    try {
      // 1️⃣ Check if an update is really needed
      const needs = await checkForBaniDBUpdate(REMOTE_DB_URL);
      if (!needs) {
        logMessage("No update needed.");
        return;
      }

      setDownloading(true);
      progressAnim.setValue(0);
      setProgress(0);

      const tmpPath = `${LOCAL_DB_PATH}.download`;
      logMessage("Downloading new DB…");

      // 2️⃣ Kick off the RNFS download with a progress callback
      await downloadFile({
        fromUrl: `${REMOTE_DB_URL}/${constant.DB}.db`,
        toFile: tmpPath,
        progressDivider: 1,
        begin: () => {
          setDownloadSuccess(null);
        },
        progress: ({ contentLength, bytesWritten }) => {
          const percent = Math.floor((bytesWritten / contentLength) * 100);
          progressAnim.setValue(percent);
        },
      }).promise;

      // 3️⃣ Close any open connection
      await closeDatabase();

      // 4️⃣ Swap files on disk
      if (await exists(LOCAL_DB_PATH)) {
        await unlink(LOCAL_DB_PATH);
      }

      await moveFile(tmpPath, LOCAL_DB_PATH);
      await writeRemoteMD5Hash(REMOTE_DB_URL);
      logMessage("Database updated on disk. Re-initializing…");
      await initDB();
      logMessage("Database is now up to date!");
      setDownloadSuccess(true);
      dispatch(actions.toggleDatabaseUpdateAvailable(false));
    } catch (err) {
      await unlink(`${LOCAL_DB_PATH}.download`);
      await revertMD5Hash(currentMD5Hash);
      logError(`updateDatabaseIfNeeded error: ${err.message}`);
      setDownloadSuccess(false);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={[styles.container, darkModeContainer]}>
      {downloadSuccess !== null && (
        <Text style={[styles.label, darkModeText]}>
          {downloadSuccess ? STRINGS.downloadSuccessful : STRINGS.downloadFailed}
        </Text>
      )}
      {!downloadSuccess && (
        <>
          {downloading && <DownloadAnimation progress={progress} progressAnim={progressAnim} />}
          <DownloadControls
            downloading={downloading}
            onStartDownload={startDownload}
            darkModeText={darkModeText}
          />
        </>
      )}
    </View>
  );
};

export default DownloadComponent;
