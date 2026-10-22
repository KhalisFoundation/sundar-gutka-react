import { useEffect } from "react";
import { exists, readDir } from "react-native-fs";
import { useDispatch, useStore } from "react-redux";
import { logError, logMessage } from "@common";
import { AUDIO_DIRECTORY_PATH } from "../../ReaderScreen/components/AudioPlayer/utils/audioDownloader";
import { addDownloadEntry, markAudioStorageMigrated } from "../actions";

/**
 * Whether audio already on disk has been adopted into the download registry.
 * The orphan sweep (audioReconcile) deletes every file the registry does not
 * own, so it must not run before this is true. Read from the store, where it is
 * persisted together with the registry entries it vouches for.
 */
export const isStorageMigrated = (state) => Boolean(state?.audioStorageMigrated);

// Convert "BhaiJarnailSingh" → "Bhai Jarnail Singh"
const folderNameToDisplayName = (name) => name.replace(/([A-Z])/g, " $1").trim();

/**
 * Adopts audio the previous release downloaded into the download registry.
 *
 * That release saved tracks as `audio/<Artist>/<file>.m4a` (with a `.json`
 * beside each) and kept no registry at all. The registry is what the rest of
 * the downloads code believes, and the reconcile pass deletes any file under
 * the audio directory it does not own, so without this every track a user had
 * downloaded would be deleted on the first launch after the update. Both
 * releases use the same directory, so files are registered where they are,
 * lyrics files included. Only adds entries the registry does not already have.
 *
 * It is marked done only when every directory was read. A read that fails
 * leaves it to run again next launch — marking it done after reading nothing
 * would let the sweep delete the files it never saw.
 */
const useStorageMigration = () => {
  const dispatch = useDispatch();
  const store = useStore();

  useEffect(() => {
    const migrate = async () => {
      try {
        if (isStorageMigrated(store.getState())) return;

        if (!(await exists(AUDIO_DIRECTORY_PATH))) {
          dispatch(markAudioStorageMigrated());
          return;
        }

        const registry = store.getState()?.downloadRegistry || {};
        const artistDirs = await readDir(AUDIO_DIRECTORY_PATH).catch(() => null);
        if (!artistDirs) {
          logMessage("Audio storage migration: audio directory unreadable, will retry");
          return;
        }
        let complete = true;
        let adopted = 0;

        for (const artistDir of artistDirs) {
          // eslint-disable-next-line no-continue -- skip non-directory entries
          if (!artistDir.isDirectory || !artistDir.isDirectory()) continue;
          const artistName = artistDir.name;

          // eslint-disable-next-line no-await-in-loop
          const files = await readDir(artistDir.path).catch(() => null);
          if (!files) {
            complete = false;
            // eslint-disable-next-line no-continue -- the rest can still be adopted
            continue;
          }
          const names = new Set(files.map((f) => f.name));
          for (const file of files) {
            // eslint-disable-next-line no-continue -- only .m4a files are migrated
            if (!file.name.endsWith(".m4a")) continue;
            const relativePath = `${artistName}/${file.name}`;
            // eslint-disable-next-line no-continue -- already owned by the registry
            if (registry[relativePath]) continue;
            const jsonName = file.name.replace(/\.m4a$/, ".json");
            const onDiskBytes = Number(file.size) || 0;
            dispatch(
              addDownloadEntry({
                relativePath,
                artistDisplayName: folderNameToDisplayName(artistName),
                baniTitle: file.name.replace(/\.m4a$/, ""),
                baniId: null,
                sizeMB: onDiskBytes / (1024 * 1024),
                // Unknown, not the size on disk: the previous release could
                // leave a download cut short, and recording its truncated
                // size as exact would make the integrity check pass it. With
                // 0 the check falls back to comparing against the size the
                // manifest expects.
                sizeBytes: 0,
                hasLyrics: names.has(jsonName),
                downloadedAt: Date.now(),
              })
            );
            adopted += 1;
          }
        }

        if (!complete) {
          logMessage(`Audio storage migration partial (${adopted} adopted), will retry`);
          return;
        }
        dispatch(markAudioStorageMigrated());
        logMessage(`Audio storage migration complete (${adopted} adopted)`);
      } catch (err) {
        logError(`Storage migration error: ${err?.message}`);
      }
    };

    migrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default useStorageMigration;
