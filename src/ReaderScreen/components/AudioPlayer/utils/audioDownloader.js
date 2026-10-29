import {
  downloadFile,
  exists,
  stat,
  DocumentDirectoryPath,
  unlink,
  mkdir,
  readDir,
  readFile,
  writeFile,
} from "react-native-fs";
import { logError, logMessage } from "@common";
import { checkIsJsonRemoteExists } from "./checkHelper";

// Downloads live in app-internal storage (DocumentDirectoryPath) — the single
// canonical location. It's always available at app-init, so the resolved path
// is deterministic across launches on every OEM.
//
// External app-specific storage (ExternalDirectoryPath) was tried but reverted:
// getExternalFilesDir() isn't reliably mounted at JS-init on some OEMs
// (Vivo/Realme/Oppo), so `ExternalDirectoryPath ?? DocumentDirectoryPath`
// resolved differently from launch to launch, flipping the base dir and
// silently orphaning every download (empty "Manage downloads", re-download on
// replay). It also gets wiped by "Clear Storage" anyway, so it bought no
// durability — internal is strictly better here.
const AUDIO_DIRECTORY = `${DocumentDirectoryPath}/audio`;
// Prefetch is an ephemeral LRU cache — separate dir so "Clear Data" wipes it.
const PREFETCH_AUDIO_DIRECTORY = `${DocumentDirectoryPath}/audio_prefetch`;
export const AUDIO_DIRECTORY_PATH = AUDIO_DIRECTORY;
const PREFETCH_INDEX_PATH = `${PREFETCH_AUDIO_DIRECTORY}/.prefetch-index.json`;

// Dedicated cache for the tiny (~200KB) 15-second preview clips, kept separate
// from the full-track caches so previews are never evicted by the full-track
// LRU and vice-versa.
//
// The `_v2` suffix intentionally abandons any clips written by earlier builds:
// a concurrent-download race could truncate a clip on disk, and a truncated
// M4A wedges ExoPlayer in Buffering forever on Android. Bumping the directory
// guarantees every device re-downloads clean clips via the now race-free
// downloader, with no reinstall or manual cache-clear needed.
const LEGACY_PREVIEW_AUDIO_DIRECTORY = `${DocumentDirectoryPath}/audio_preview`;
const PREVIEW_AUDIO_DIRECTORY = `${DocumentDirectoryPath}/audio_preview_v2`;
// Best-effort one-time cleanup of the abandoned v1 directory (guarded so the
// unlink is attempted at most once per app session).
let legacyPreviewCleanupDone = false;
// In-flight preview downloads, keyed by preview URL, so concurrent callers
// (reader-open prefetch + an on-tap request for the same clip) share one task
// instead of racing to write the same file.
const previewDownloadsInFlight = new Map();

/**
 * Generate safe filename from URL and track info
 */
const generateFilename = (url) => {
  try {
    // Extract filename from URL or generate one
    const urlParts = url.split("/");
    const artistName = urlParts[urlParts.length - 2];
    const fileName = urlParts[urlParts.length - 1];
    return { artistName, fileName };
  } catch (error) {
    // Fallback to simple filename
    return { artistName: null, fileName: null };
  }
};

export const ensureArtistDirectory = async (artistName, baseDirectory = AUDIO_DIRECTORY) => {
  const audioDirectoryExists = await exists(baseDirectory);

  if (!audioDirectoryExists) {
    await mkdir(baseDirectory, { NSURLIsExcludedFromBackupKey: true });
  }

  const artistDirectory = `${baseDirectory}/${artistName}`;
  const artistDirectoryExists = await exists(artistDirectory);

  if (!artistDirectoryExists) {
    await mkdir(artistDirectory, { NSURLIsExcludedFromBackupKey: true });
  }
};

const buildTrackPaths = (url, baseDirectory = AUDIO_DIRECTORY) => {
  const { artistName, fileName } = generateFilename(url);
  const audioRelativePath = `${artistName}/${fileName}`;
  const fullAudioPath = `${baseDirectory}/${audioRelativePath}`;
  const jsonFileName = fileName.replace(/\.[^/.]+$/, ".json");
  const jsonRelativePath = `${artistName}/${jsonFileName}`;
  const fullJsonPath = `${AUDIO_DIRECTORY}/${jsonRelativePath}`;
  const jsonUrl = url.replace(/\.[^/.]+$/, ".json");

  return {
    artistName,
    fileName,
    audioRelativePath,
    fullAudioPath,
    jsonFileName,
    jsonRelativePath,
    fullJsonPath,
    jsonUrl,
  };
};

/**
 * Check if track is already downloaded
 */
export const isTrackDownloaded = async (url) => {
  try {
    const { artistName, fileName } = generateFilename(url);
    const audioFilePath = `${AUDIO_DIRECTORY}/${artistName}/${fileName}`;
    const jsonFileName = fileName.replace(/\.[^/.]+$/, ".json");
    const jsonFilePath = `${AUDIO_DIRECTORY}/${artistName}/${jsonFileName}`;

    const audioFileExists = await exists(audioFilePath);
    const jsonFileExists = await exists(jsonFilePath);

    return { audioFileExists, jsonFileExists };
  } catch (error) {
    logError(`Error checking if track is downloaded: ${error.message}`);
    return { audioFileExists: false, jsonFileExists: false };
  }
};

/**
 * Get local file path for downloaded track
 */
export const getLocalTrackPath = (url) => {
  const { artistName, fileName } = generateFilename(url);
  return `${artistName}/${fileName}`;
};

export const getFullLocalTrackPath = (url) => {
  const { artistName, fileName } = generateFilename(url);
  return `${AUDIO_DIRECTORY}/${artistName}/${fileName}`;
};

export const getFullPrefetchTrackPath = (url) => {
  const { artistName, fileName } = generateFilename(url);
  return `${PREFETCH_AUDIO_DIRECTORY}/${artistName}/${fileName}`;
};

export const getLocalJsonPath = (url) => {
  const { artistName, fileName } = generateFilename(url);
  const jsonFileName = fileName.replace(/\.[^/.]+$/, ".json");
  return `${artistName}/${jsonFileName}`;
};

export const getFullLocalJsonPath = (url) => {
  const { artistName, fileName } = generateFilename(url);
  const jsonFileName = fileName.replace(/\.[^/.]+$/, ".json");
  return `${AUDIO_DIRECTORY}/${artistName}/${jsonFileName}`;
};

export const downloadAudioOnly = async (url, trackTitle, options = {}) => {
  const { skipDirectorySetup = false, targetDirectory = "main", expectedSizeMB = 0 } = options;
  let baseDirectory = AUDIO_DIRECTORY;
  if (targetDirectory === "prefetch") baseDirectory = PREFETCH_AUDIO_DIRECTORY;
  else if (targetDirectory === "preview") baseDirectory = PREVIEW_AUDIO_DIRECTORY;
  const { artistName, fileName, fullAudioPath, audioRelativePath } = buildTrackPaths(
    url,
    baseDirectory
  );

  if (!skipDirectorySetup) {
    await ensureArtistDirectory(artistName, baseDirectory);
  }

  const audioFileExists = await exists(fullAudioPath);
  if (audioFileExists) {
    const expectedBytes = expectedSizeMB > 0 ? expectedSizeMB * 1024 * 1024 : 0;
    if (expectedBytes > 0) {
      const existingFileStat = await stat(fullAudioPath);
      if (Number(existingFileStat.size) < expectedBytes * 0.9) {
        await unlink(fullAudioPath).catch(() => {});
      } else {
        logMessage(`Audio already downloaded: ${fileName}`);
        return { relativePath: audioRelativePath, alreadyExists: true, downloaded: false, jobId: null };
      }
    } else {
      logMessage(`Audio already downloaded: ${fileName}`);
      return { relativePath: audioRelativePath, alreadyExists: true, downloaded: false, jobId: null };
    }
  }

  // progressDivider: 20 — fire the progress callback only once per ~5 % of file size
  // instead of on every bytes chunk, keeping the JS thread free on low-end devices.
  const audioDownloadTask = downloadFile({
    fromUrl: url,
    toFile: fullAudioPath,
    progressDivider: 20,
    begin: () => {
      logMessage(`Audio download started for: ${trackTitle}`);
    },
  });

  const jobId = audioDownloadTask.jobId;
  const audioResult = await audioDownloadTask.promise;

  // ── Strict validation: reject anything that isn't a clean 200 download ──
  if (audioResult.statusCode !== 200) {
    // Delete partial/error file so exists() never returns true for a corrupt file.
    await unlink(fullAudioPath).catch(() => {});
    throw new Error(`Audio download failed with HTTP ${audioResult.statusCode}`);
  }

  const finalAudioExists = await exists(fullAudioPath);
  if (!finalAudioExists) {
    throw new Error("Audio download completed but file was not created on disk");
  }

  // Size sanity check — a valid M4A bani audio file is always well over 100KB.
  // A file under 100KB means the download was truncated (server closed early,
  // network drop, DOZE killed the connection, etc.) or the moov atom is missing.
  const fileStat = await stat(fullAudioPath);
  if (Number(fileStat.size) < 100000) {
    await unlink(fullAudioPath).catch(() => {});
    throw new Error(`Downloaded file too small: ${fileStat.size} bytes — likely corrupt/truncated`);
  }

  logMessage(`Audio download completed: ${fileName} (${fileStat.size} bytes)`);
  return { relativePath: audioRelativePath, alreadyExists: false, downloaded: true, jobId };
};

// ── 15-second audio previews ────────────────────────────────────────────────
// Preview clips live at the canonical track URL with a `-preview` suffix, e.g.
//   .../BhaiJarnailSingh/RehrasSahib.m4a         -> RehrasSahib-preview.m4a
//   .../BhaiJarnailSingh/RehrasSahib-trimmed.m4a -> RehrasSahib-trimmed-preview.m4a
// AnandSahib-6-pauri reuses the full Anand preview (there is no 6-pauri clip).
// A preview URL may 404 (not yet generated on the CDN) — callers fall back to
// streaming the full track cut at 15s.
export const getPreviewRemoteUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (!/\.m4a(\?|$)/i.test(url)) return null;
  const normalized = url.replace(/-6-pauri\.m4a(\?|$)/i, ".m4a$1");
  return normalized.replace(/\.m4a(\?|$)/i, "-preview.m4a$1");
};

export const getFullPreviewTrackPath = (previewUrl) => {
  const { artistName, fileName } = generateFilename(previewUrl);
  return `${PREVIEW_AUDIO_DIRECTORY}/${artistName}/${fileName}`;
};

// Ensure the preview clip for a track is on disk, returning its local path (or
// null if there is no preview / the download failed). Concurrent callers for
// the same clip share a single in-flight task.
export const ensurePreviewDownloaded = async (canonicalUrl, trackTitle = "Preview") => {
  const previewUrl = getPreviewRemoteUrl(canonicalUrl);
  if (!previewUrl || !/^https?:\/\//i.test(previewUrl)) {
    return null;
  }
  // This check and the map set below MUST run with no await between them —
  // otherwise two concurrent callers could both pass the check and both kick
  // off a download to the SAME file, whose interleaved writes truncate it on
  // disk. A truncated clip then wedges ExoPlayer in Buffering forever on the
  // next play. The exists() fast-path therefore lives INSIDE the task, after
  // the map is claimed.
  if (previewDownloadsInFlight.has(previewUrl)) {
    return previewDownloadsInFlight.get(previewUrl);
  }

  const fullPath = getFullPreviewTrackPath(previewUrl);
  const task = (async () => {
    try {
      if (await exists(fullPath)) {
        return fullPath;
      }
      await downloadAudioOnly(previewUrl, trackTitle, { targetDirectory: "preview" });
      return (await exists(fullPath)) ? fullPath : null;
    } catch (_) {
      await unlink(fullPath).catch(() => {});
      return null;
    } finally {
      previewDownloadsInFlight.delete(previewUrl);
    }
  })();

  previewDownloadsInFlight.set(previewUrl, task);
  return task;
};

// Self-heal: drop a preview clip so the next ensurePreviewDownloaded re-fetches
// it (used when a clip plays back as truncated/corrupt).
export const deletePreviewClip = async (canonicalUrl) => {
  const previewUrl = getPreviewRemoteUrl(canonicalUrl);
  if (!previewUrl) return;
  await unlink(getFullPreviewTrackPath(previewUrl)).catch(() => {});
};

// Warm every artist's preview clip for a bani in parallel (deduped) as soon as
// the track set is known, so tapping an artist plays instantly.
export const prefetchPreviews = async (tracks) => {
  if (!Array.isArray(tracks) || tracks.length === 0) return;

  if (!legacyPreviewCleanupDone) {
    legacyPreviewCleanupDone = true;
    unlink(LEGACY_PREVIEW_AUDIO_DIRECTORY).catch(() => {});
  }

  const seen = new Set();
  const queue = [];
  for (const track of tracks) {
    const canonical = track?.remoteUrl || track?.audioUrl;
    const previewUrl = getPreviewRemoteUrl(canonical);
    if (!previewUrl || !/^https?:\/\//i.test(previewUrl) || seen.has(previewUrl)) continue;
    seen.add(previewUrl);
    queue.push({ canonical, title: track?.displayName || "Preview" });
  }
  if (queue.length === 0) return;

  await Promise.all(
    queue.map((item) => ensurePreviewDownloaded(item.canonical, item.title).catch(() => {}))
  );
};

const readPrefetchIndex = async () => {
  try {
    const indexExists = await exists(PREFETCH_INDEX_PATH);
    if (!indexExists) {
      return {};
    }
    const raw = await readFile(PREFETCH_INDEX_PATH, "utf8");
    const parsed = JSON.parse(raw || "{}");
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return {};
  } catch (_) {
    return {};
  }
};

const writePrefetchIndex = async (indexData) => {
  try {
    const indexDirectoryExists = await exists(PREFETCH_AUDIO_DIRECTORY);
    if (!indexDirectoryExists) {
      await mkdir(PREFETCH_AUDIO_DIRECTORY, { NSURLIsExcludedFromBackupKey: true });
    }
    await writeFile(PREFETCH_INDEX_PATH, JSON.stringify(indexData), "utf8");
  } catch (_) {
    // Best effort cache metadata write.
  }
};

export const touchPrefetchTrack = async (url) => {
  try {
    const fullPath = getFullPrefetchTrackPath(url);
    const fileExists = await exists(fullPath);
    if (!fileExists) {
      return;
    }

    const index = await readPrefetchIndex();
    index[fullPath] = Date.now();
    await writePrefetchIndex(index);
  } catch (_) {
    // Best effort cache metadata update.
  }
};

// maxTracks defaults to Infinity → no cap on the number of cached tracks. The
// pass still prunes index entries whose files no longer exist and removes empty
// artist directories; it just never evicts live cache files by count.
export const prunePrefetchCache = async (maxTracks = Infinity) => {
  try {
    const directoryExists = await exists(PREFETCH_AUDIO_DIRECTORY);
    if (!directoryExists) {
      return;
    }

    const index = await readPrefetchIndex();
    const allEntries = Object.entries(index);

    // Run all existence checks in parallel — avoids serial filesystem blocking
    // on every seek (each exists() syscall can take 5-20ms on Android flash).
    const verifiedEntries = (
      await Promise.all(
        allEntries
          .filter(([fullPath]) => fullPath !== PREFETCH_INDEX_PATH)
          .map(async ([fullPath, ts]) => {
            const fileExists = await exists(fullPath);
            return fileExists ? [fullPath, Number(ts) || 0] : null;
          })
      )
    ).filter(Boolean);

    verifiedEntries.sort((a, b) => b[1] - a[1]);
    const keepSet = new Set(verifiedEntries.slice(0, maxTracks).map(([fullPath]) => fullPath));

    const nextIndex = {};
    for (const [fullPath, ts] of verifiedEntries) {
      if (keepSet.has(fullPath)) {
        nextIndex[fullPath] = ts;
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      await unlink(fullPath).catch(() => {});
    }

    // Clean up empty artist directories if any were left behind.
    const children = await readDir(PREFETCH_AUDIO_DIRECTORY).catch(() => []);
    for (const entry of children) {
      if (!entry.isDirectory || !entry.isDirectory()) {
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const subItems = await readDir(entry.path).catch(() => []);
      if (subItems.length === 0) {
        // eslint-disable-next-line no-await-in-loop
        await unlink(entry.path).catch(() => {});
      }
    }

    await writePrefetchIndex(nextIndex);
  } catch (error) {
    logError(`Error pruning prefetch cache: ${error?.message || error}`);
  }
};

export const downloadLyricsOnly = async (url, trackTitle, options = {}) => {
  const { skipDirectorySetup = false } = options;
  const { artistName, jsonFileName, jsonUrl, fullJsonPath, jsonRelativePath } =
    buildTrackPaths(url);

  if (!skipDirectorySetup) {
    await ensureArtistDirectory(artistName);
  }

  // ── 1. Local check first — zero network if already on disk ───────────────
  const jsonFileExists = await exists(fullJsonPath);
  if (jsonFileExists) {
    logMessage(`Lyrics already downloaded: ${jsonFileName}`);
    return {
      relativePath: jsonRelativePath,
      alreadyExists: true,
      downloaded: false,
      remoteMissing: false,
    };
  }

  // ── 2. HEAD check — skip the download if the remote JSON doesn't exist ────
  const jsonRemoteExists = await checkIsJsonRemoteExists(jsonUrl);
  if (!jsonRemoteExists) {
    logMessage(`Lyrics not available for download, skipping: ${jsonFileName}`);
    return {
      relativePath: jsonRelativePath,
      alreadyExists: false,
      downloaded: false,
      remoteMissing: true,
    };
  }

  const jsonDownloadTask = downloadFile({
    fromUrl: jsonUrl,
    toFile: fullJsonPath,
    progressDivider: 20,
    begin: () => {
      logMessage(`Lyrics download started for: ${trackTitle}`);
    },
  });

  const jsonResult = await jsonDownloadTask.promise;

  // A lyrics file that is not there is an expected state of the catalog, not a
  // fault in the app — kept out of Crashlytics.
  if (jsonResult.statusCode !== 200) {
    logMessage(`Lyrics download failed with status code: ${jsonResult.statusCode}`);
  }

  const finalJsonExists = await exists(fullJsonPath);
  if (!finalJsonExists) {
    logMessage("Lyrics download completed but file was not created");
  }

  logMessage(`Lyrics download completed: ${jsonFileName}`);
  return {
    relativePath: jsonRelativePath,
    alreadyExists: false,
    downloaded: true,
    remoteMissing: false,
  };
};

/**
 * Download audio track with progress tracking
 */
export const downloadTrack = async (url, trackTitle, expectedSizeMB = 0) => {
  try {
    const { artistName, fileName, jsonFileName } = buildTrackPaths(url);

    await ensureArtistDirectory(artistName);

    const audioResult = await downloadAudioOnly(url, trackTitle, { skipDirectorySetup: true, expectedSizeMB });
    const lyricsResult = await downloadLyricsOnly(url, trackTitle, { skipDirectorySetup: true });
    const lyricsAvailable = !lyricsResult.remoteMissing;
    const lyricsSatisfied = lyricsAvailable
      ? lyricsResult.alreadyExists || lyricsResult.downloaded
      : true;

    if (audioResult.alreadyExists && lyricsSatisfied) {
      logMessage(`Track already downloaded${lyricsAvailable ? " with lyrics" : ""}: ${fileName}`);
      const result = {
        audioRelativePath: audioResult.relativePath,
        jsonRelativePath: lyricsAvailable ? lyricsResult.relativePath : null,
      };
      return result;
    }

    if (lyricsAvailable) {
      logMessage(`Download completed: ${fileName} and ${jsonFileName}`);
    } else {
      logMessage(`Download completed: ${fileName} (no lyrics available)`);
    }

    const result = {
      audioRelativePath:
        audioResult.alreadyExists || audioResult.downloaded ? audioResult.relativePath : null,
      jsonRelativePath: lyricsAvailable ? lyricsResult.relativePath : null,
    };
    return result;
  } catch (error) {
    logError(`Download error for ${trackTitle}: ${error.message}`);

    // Clean up partial downloads if they exist
    try {
      const fullLocalPath = getFullLocalTrackPath(url);
      const { artistName, fileName } = generateFilename(url);
      const jsonFileName = fileName.replace(/\.[^/.]+$/, ".json");
      const fullJsonPath = `${AUDIO_DIRECTORY}/${artistName}/${jsonFileName}`;

      const audioFileExists = await exists(fullLocalPath);
      const jsonFileExists = await exists(fullJsonPath);

      if (audioFileExists) {
        await unlink(fullLocalPath);
      }
      if (jsonFileExists) {
        await unlink(fullJsonPath);
      }
    } catch (cleanupError) {
      logError(`Error cleaning up failed download: ${cleanupError.message}`);
    }
    logError(`Download error for ${trackTitle}: ${error.message}`);
    return null;
  }
};
