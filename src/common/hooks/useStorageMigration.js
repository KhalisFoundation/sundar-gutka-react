import { useEffect } from "react";
import { Platform } from "react-native";
import { DocumentDirectoryPath, exists, readDir, copyFile, unlink } from "react-native-fs";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError, logMessage } from "@common";
import {
  AUDIO_DIRECTORY_PATH,
  ensureArtistDirectory,
} from "../../ReaderScreen/components/AudioPlayer/utils/audioDownloader";
import { setDownloadRegistry } from "../actions";

const MIGRATION_FLAG_KEY = "sg_audio_v2_migrated";

// Convert "BhaiJarnailSingh" → "Bhai Jarnail Singh"
const folderNameToDisplayName = (name) => name.replace(/([A-Z])/g, " $1").trim();

const useStorageMigration = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const migrate = async () => {
      try {
        const done = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
        if (done) return;

        const oldBase = `${DocumentDirectoryPath}/audio`;
        const oldExists = await exists(oldBase);
        if (!oldExists) {
          await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "1");
          return;
        }

        const newBase = AUDIO_DIRECTORY_PATH;
        // If old === new (no external storage available on this device), skip.
        if (oldBase === newBase) {
          await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "1");
          return;
        }

        const artistDirs = await readDir(oldBase).catch(() => []);
        const registry = {};

        for (const artistDir of artistDirs) {
          // eslint-disable-next-line no-continue -- skip non-directory entries
          if (!artistDir.isDirectory || !artistDir.isDirectory()) continue;
          const artistName = artistDir.name;

          // eslint-disable-next-line no-await-in-loop
          await ensureArtistDirectory(artistName).catch(() => {});

          // eslint-disable-next-line no-await-in-loop
          const files = await readDir(artistDir.path).catch(() => []);
          for (const file of files) {
            // eslint-disable-next-line no-continue -- only .m4a files are migrated
            if (!file.name.endsWith(".m4a")) continue;
            const oldPath = file.path;
            const newPath = `${newBase}/${artistName}/${file.name}`;
            try {
              // eslint-disable-next-line no-await-in-loop
              await copyFile(oldPath, newPath);
              // eslint-disable-next-line no-await-in-loop
              await unlink(oldPath).catch(() => {});
              const jsonOld = oldPath.replace(/\.m4a$/, ".json");
              // eslint-disable-next-line no-await-in-loop
              await unlink(jsonOld).catch(() => {});

              const relativePath = `${artistName}/${file.name}`;
              registry[relativePath] = {
                relativePath,
                artistDisplayName: folderNameToDisplayName(artistName),
                baniTitle: file.name.replace(/\.m4a$/, ""),
                baniId: null,
                sizeMB: file.size ? file.size / (1024 * 1024) : 0,
                hasLyrics: false,
                downloadedAt: Date.now(),
              };
              logMessage(`Migrated: ${relativePath}`);
            } catch (e) {
              logError(`Migration failed for ${file.name}: ${e?.message}`);
            }
          }
        }

        if (Object.keys(registry).length > 0) {
          dispatch(setDownloadRegistry(registry));
        }

        await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "1");
        logMessage("Audio storage migration complete");
      } catch (err) {
        logError(`Storage migration error: ${err?.message}`);
      }
    };

    migrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default useStorageMigration;
