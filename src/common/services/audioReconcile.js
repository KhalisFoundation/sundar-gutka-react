import { exists, readDir, readFile, stat, unlink, writeFile } from "react-native-fs";
import TrackPlayer from "react-native-track-player";
import NetInfo from "@react-native-community/netinfo";
import { logMessage, logNetworkError } from "@common";
import {
  AUDIO_DIRECTORY_PATH,
  getLocalTrackPath,
} from "../../ReaderScreen/components/AudioPlayer/utils/audioDownloader";
import { ensureLyricsCached } from "../../ReaderScreen/components/AudioPlayer/utils/lyricsCache";
import {
  fetchValidators,
  NO_CACHE_HEADERS,
  readValidatorMeta,
  removeValidatorMeta,
  validatorsMatch,
  validatorsFromResponse,
  writeValidatorMeta,
} from "../../ReaderScreen/components/AudioPlayer/utils/validatorMeta";
import {
  enqueueDownload,
  removeDownloadEntries,
  setAudioManifest,
  updateDownloadEntries,
} from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// Downloaded-audio reconcile.
//
// The backend changes tracks, lyrics JSON and artists AT THE SAME URL, and a
// device that downloaded a track would otherwise keep its copy for ever: the
// download registry only knows a file exists, not whether it is still the file
// the CDN serves. This pass, run whenever a fresh manifest lands (the track
// list opening, the daily catalog sweep), brings every download in line with
// the manifest that names it:
//
//   • absent from every length group of its bani  → the track or artist was
//     removed: delete the files, drop the registry entry, remove the empty
//     artist folder. Absent from the CURRENT length only is not removal — the
//     length-variant banis put different files in each group.
//   • same URL, different bytes (validators differ) → a re-cut: delete the
//     audio AND its companion JSON together and queue a fresh download of both,
//     so a new audio never plays against old timestamps.
//   • same bytes, companion JSON changed or newly available → refetch the JSON
//     alone, keeping the audio. The lyrics the sync-scroll actually reads —
//     the manifest's lyricsUrl, held in the lyrics cache for streamed and
//     downloaded tracks alike — are revalidated for every track of the bani at
//     the same time, so a timestamp fix lands on the next open, not the next
//     daily sweep.
//   • artist renamed → correct the registry name; the bytes did not change, so
//     nothing is re-downloaded.
//   • a file on disk that no registry entry or queued download owns → an orphan
//     left by a renamed path or an interrupted delete: remove it.
//
// What it will NOT do, so a bad moment never costs a library:
//   • act on a bani whose manifest did not come back 200 — the caller only
//     passes manifests it just fetched; offline, timeout, 5xx and 404 mean
//     "nothing is known", not "nothing exists".
//   • touch the track the player currently holds — unlinking a loaded file is
//     a native playback error. It is re-checked on the next open.
//   • touch a path with a download in flight.
//   • replace a re-cut track while WiFi-only is on and the device is on
//     cellular: the old copy keeps playing, and the swap waits for WiFi.
//
// Every step is best-effort and individually wrapped; expected conditions
// (offline, 304, 404, a missing file) are messages, never Crashlytics errors.
// ─────────────────────────────────────────────────────────────────────────────

const JSON_TIMEOUT_MS = 15000;

const fullPathOf = (relativePath) => `${AUDIO_DIRECTORY_PATH}/${relativePath}`;
const jsonRelativePathOf = (relativePath) => relativePath.replace(/\.[^/.]+$/, ".json");
const jsonUrlOf = (link) => link.replace(/\.[^/.]+$/, ".json");
const artistDirOf = (relativePath) => relativePath.split("/")[0];

// Relative "Artist/file.m4a" key for any file the audio directory can hold:
// the audio itself, its companion JSON, or either one's validator sidecar.
export const trackKeyForFile = (artistDir, fileName) => {
  const withoutMeta = fileName.replace(/\.meta$/, "");
  const stem = withoutMeta.replace(/\.json$/, ".m4a");
  return `${artistDir}/${stem}`;
};

/**
 * Every track the manifest of one bani refers to, across ALL its length groups,
 * keyed by the on-disk relative path. Membership in any group is what decides
 * a download still exists; the group the user's length maps to decides only
 * what the list shows.
 */
export const expectedTracksFromGroups = (groups) => {
  const byPath = {};
  if (!groups || typeof groups !== "object") return byPath;
  Object.values(groups).forEach((group) => {
    (group?.artists || []).forEach((artist) => {
      if (!artist?.link) return;
      const key = getLocalTrackPath(artist.link);
      if (!byPath[key]) {
        byPath[key] = {
          link: artist.link,
          name: artist.name ?? "",
          sizeMb: artist.sizeMb ?? 0,
          lyricsUrl: artist.lyricsUrl || null,
        };
      }
    });
  });
  return byPath;
};

const currentlyLoadedKey = async () => {
  try {
    if (typeof TrackPlayer?.getActiveTrack !== "function") return null;
    const active = await TrackPlayer.getActiveTrack();
    return active?.url ? getLocalTrackPath(String(active.url)) : null;
  } catch (_) {
    return null;
  }
};

const isOnCellular = async () => {
  try {
    const net = await NetInfo.fetch();
    return net?.type === "cellular";
  } catch (_) {
    return false;
  }
};

const removeEmptyArtistDir = async (artistDir) => {
  const dir = `${AUDIO_DIRECTORY_PATH}/${artistDir}`;
  const left = await readDir(dir).catch(() => null);
  if (left && left.length === 0) await unlink(dir).catch(() => {});
};

// Audio, companion JSON and both sidecars go together; a track is never left
// half present.
const deleteTrackFiles = async (relativePath) => {
  const audioPath = fullPathOf(relativePath);
  const jsonPath = fullPathOf(jsonRelativePathOf(relativePath));
  await Promise.all([
    unlink(audioPath).catch(() => {}),
    unlink(jsonPath).catch(() => {}),
    removeValidatorMeta(audioPath),
    removeValidatorMeta(jsonPath),
  ]);
  await removeEmptyArtistDir(artistDirOf(relativePath));
};

// "same" | "changed" | "unknown". Unknown (offline, no validators at all)
// means leave the file alone.
const checkAudio = async (relativePath, entry, link) => {
  const fullPath = fullPathOf(relativePath);
  const live = await fetchValidators(link);
  if (!live) return "unknown";
  const stored = await readValidatorMeta(fullPath);
  const match = validatorsMatch(stored, live);
  if (match !== null) return match ? "same" : "changed";

  // No sidecar yet — a download made before validators were recorded. The
  // byte length decides: a re-cut always changes it. A match adopts the live
  // validators so every later check is exact.
  if (!live.contentLength) return "unknown";
  let localBytes = Number(entry.sizeBytes) || 0;
  if (!localBytes) {
    const info = await stat(fullPath).catch(() => null);
    localBytes = Number(info?.size) || 0;
  }
  if (!localBytes) return "unknown";
  if (localBytes !== live.contentLength) return "changed";
  await writeValidatorMeta(fullPath, { ...live, revalidatedAt: Date.now() });
  return "same";
};

/**
 * Bring a downloaded track's companion JSON up to date with the CDN: a
 * conditional GET that costs nothing for an unchanged file, writes a corrected
 * one over the old, and picks up a JSON that did not exist when the audio was
 * downloaded. A failure of any kind keeps whatever is on disk.
 * @returns {boolean} true when the file on disk was written.
 */
export const refreshCompanionJson = async (link) => {
  const jsonPath = fullPathOf(jsonRelativePathOf(getLocalTrackPath(link)));
  const stored = await readValidatorMeta(jsonPath);
  const headers = { ...NO_CACHE_HEADERS };
  if (await exists(jsonPath)) {
    if (stored?.etag) headers["If-None-Match"] = stored.etag;
    else if (stored?.lastModified) headers["If-Modified-Since"] = stored.lastModified;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), JSON_TIMEOUT_MS);
  try {
    const response = await fetch(jsonUrlOf(link), { headers, signal: controller.signal });
    if (response.status === 304) {
      await writeValidatorMeta(jsonPath, { ...stored, revalidatedAt: Date.now() });
      return false;
    }
    if (!response.ok) return false;
    const text = await response.text();
    JSON.parse(text);
    if (text === (await readFile(jsonPath, "utf8").catch(() => null))) {
      await writeValidatorMeta(jsonPath, {
        ...validatorsFromResponse(response),
        revalidatedAt: Date.now(),
      });
      return false;
    }
    await writeFile(jsonPath, text, "utf8");
    await writeValidatorMeta(jsonPath, {
      ...validatorsFromResponse(response),
      revalidatedAt: Date.now(),
    });
    return true;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Files under the audio directory that nothing owns any more.
const sweepOrphans = async ({ owned, skip }) => {
  const deleted = [];
  if (!(await exists(AUDIO_DIRECTORY_PATH).catch(() => false))) return deleted;
  const artists = await readDir(AUDIO_DIRECTORY_PATH).catch(() => []);
  await Promise.all(
    artists
      .filter((a) => a.isDirectory?.())
      .map(async (artist) => {
        const files = await readDir(artist.path).catch(() => []);
        await Promise.all(
          files.map(async (file) => {
            const key = trackKeyForFile(artist.name, file.name);
            if (owned.has(key) || skip.has(key)) return;
            await unlink(file.path).catch(() => {});
            deleted.push(`${artist.name}/${file.name}`);
          })
        );
        await removeEmptyArtistDir(artist.name);
      })
  );
  return deleted;
};

const runReconcile = async ({ manifests, getState, dispatch }) => {
  const state = getState() || {};
  const registry = state.downloadRegistry || {};
  const queue = state.downloadQueue || {};
  const wifiOnly = Boolean(state.downloadWifiOnly);
  const expectedByBani = {};
  Object.entries(manifests || {}).forEach(([baniId, groups]) => {
    expectedByBani[String(baniId)] = expectedTracksFromGroups(groups);
  });

  const loadedKey = await currentlyLoadedKey();
  const replaceBlocked = wifiOnly && (await isOnCellular());
  const skip = new Set(Object.keys(queue));
  if (loadedKey) skip.add(loadedKey);

  const removed = [];
  const replaced = [];
  const jsonRefreshed = [];
  const patches = {};

  await Promise.all(
    Object.entries(registry).map(async ([relativePath, entry]) => {
      try {
        const expected = entry?.baniId != null ? expectedByBani[String(entry.baniId)] : null;
        // No fresh manifest for this bani, or the path is in use: leave it.
        if (!expected || skip.has(relativePath)) return;

        const live = expected[relativePath];
        if (!live) {
          await deleteTrackFiles(relativePath);
          removed.push(relativePath);
          return;
        }

        if (live.name && live.name !== entry.artistDisplayName) {
          patches[relativePath] = { artistDisplayName: live.name };
        }

        const verdict = await checkAudio(relativePath, entry, live.link);
        if (verdict === "changed") {
          if (replaceBlocked) return;
          await deleteTrackFiles(relativePath);
          removed.push(relativePath);
          replaced.push(relativePath);
          dispatch(
            enqueueDownload({
              trackKey: relativePath,
              audioUrl: live.link,
              displayName: live.name || entry.artistDisplayName,
              baniTitle: entry.baniTitle,
              baniNameUni: entry.baniNameUni,
              baniId: entry.baniId,
              sizeMB: live.sizeMb || entry.sizeMB || 0,
            })
          );
          return;
        }
        if (verdict === "same" && (await refreshCompanionJson(live.link))) {
          jsonRefreshed.push(relativePath);
        }
      } catch (error) {
        logMessage(`Audio reconcile skipped ${relativePath}: ${error?.message || error}`);
      }
    })
  );

  // The lyrics every track of these banis plays against, whether streamed or
  // downloaded: a conditional GET each, 304 and no bytes when unchanged.
  const lyricsUrls = new Set();
  Object.values(expectedByBani).forEach((byPath) =>
    Object.values(byPath).forEach((t) => t.lyricsUrl && lyricsUrls.add(t.lyricsUrl))
  );
  await Promise.all(
    [...lyricsUrls].map((url) => ensureLyricsCached(url, { revalidate: true }).catch(() => null))
  );

  const removedSet = new Set(removed);
  removed.forEach((key) => delete patches[key]);
  const owned = new Set(Object.keys(registry).filter((key) => !removedSet.has(key)));
  const orphansDeleted = await sweepOrphans({ owned, skip }).catch(() => []);

  if (removed.length) dispatch(removeDownloadEntries(removed));
  if (Object.keys(patches).length) dispatch(updateDownloadEntries(patches));
  // The session's per-bani manifest still lists the deleted files; without
  // this a removed track would keep its offline tick until the next launch.
  Object.entries(state.audioManifest || {}).forEach(([baniId, tracks]) => {
    if (!expectedByBani[String(baniId)] || !Array.isArray(tracks)) return;
    const kept = tracks.filter((t) => !removedSet.has(t?.audioUrl));
    if (kept.length !== tracks.length) dispatch(setAudioManifest(baniId, kept));
  });

  const changed =
    removed.length > 0 ||
    jsonRefreshed.length > 0 ||
    orphansDeleted.length > 0 ||
    Object.keys(patches).length > 0;
  if (changed) {
    logMessage(
      `Audio reconcile: removed ${removed.length}, replaced ${replaced.length}, ` +
        `lyrics refreshed ${jsonRefreshed.length}, renamed ${Object.keys(patches).length}, ` +
        `orphans ${orphansDeleted.length}`
    );
  }
  return {
    changed,
    removed,
    replaced,
    jsonRefreshed,
    renamed: Object.keys(patches),
    orphansDeleted,
  };
};

const IDLE = {
  changed: false,
  removed: [],
  replaced: [],
  jsonRefreshed: [],
  renamed: [],
  orphansDeleted: [],
};

// Runs are serialised: the track list opening during the daily sweep must see
// the sweep's deletions, not race it for the same files.
let chain = Promise.resolve();

/**
 * Reconcile every download against the manifests just fetched.
 *
 * @param {{ manifests: Object<string, object>, getState: () => object, dispatch: Function }} args
 *   manifests — `{ [baniId]: groups }`, ONLY for banis whose manifest came back
 *   200 on this pass. A bani not present here is not touched.
 * @returns {Promise<{changed: boolean, removed: string[], replaced: string[],
 *   jsonRefreshed: string[], renamed: string[], orphansDeleted: string[]}>}
 */
export const reconcileDownloads = (args) => {
  if (!args?.manifests || Object.keys(args.manifests).length === 0) return Promise.resolve(IDLE);
  const run = chain.then(() =>
    runReconcile(args).catch((error) => {
      logNetworkError(`Audio reconcile failed: ${error?.message || error}`, error);
      return IDLE;
    })
  );
  chain = run.catch(() => {});
  return run;
};

export default reconcileDownloads;
