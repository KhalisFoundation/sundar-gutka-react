import React, { useEffect, useRef, useState } from "react";
import { Animated, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { downloadFile, exists, unlink, moveFile } from "react-native-fs";
import {
  logMessage,
  logError,
  STRINGS,
  colors,
  actions,
  checkForBaniDBUpdate,
  LOCAL_DB_PATH,
  writeRemoteMD5Hash,
  REMOTE_DB_URL,
  getCurrentDBMD5Hash,
} from "@common";
import { useDispatch, useSelector } from "react-redux";
import initDB, { closeDatabase } from "../../database/connect";
import styles from "../styles";
import { darkMode } from "./styles";
import DownloadAnimation from "./DownloadAnimation";
import { revertMD5Hash } from "../../common/rnfs";

const DownloadComponent = () => {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isNightMode = useSelector((state) => state.isNightMode);
  const { darkModeContainer, darkModeText } = darkMode(isNightMode);
  const dispatch = useDispatch();

  // keep text % in sync with the animated value
  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => {
      setProgress(Math.floor(value));
    });
    return () => progressAnim.removeListener(id);
  }, [progressAnim]);

  const startDownload = async () => {
    const currentMD5Hash = await getCurrentDBMD5Hash();
    try {
      // 1️⃣ Check if an update is really needed
      const needs = await checkForBaniDBUpdate();
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
        fromUrl: REMOTE_DB_URL,
        toFile: tmpPath,
        progressDivider: 1,
        begin: () => {
          console.log("Download started");
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
      await writeRemoteMD5Hash();
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
      {downloadSuccess && (
        <Text style={[styles.label, darkModeText]}>{STRINGS.downloadSuccessful}</Text>
      )}
      {downloadSuccess === false && (
        <Text style={[styles.label, darkModeText]}>{STRINGS.downloadFailed}</Text>
      )}
      {downloading && <DownloadAnimation progress={progress} progressAnim={progressAnim} />}
      {!downloadSuccess && (
        <View style={styles.row}>
          <Text style={[styles.label, darkModeText]}>{STRINGS.newVersionAvailable}</Text>
          <TouchableOpacity
            style={[styles.button, downloading && styles.buttonDisabled]}
            onPress={startDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color={colors.WHITE_COLOR} />
            ) : (
              <Text style={[styles.buttonText, darkModeText]}>{STRINGS.startDownload}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default DownloadComponent;
