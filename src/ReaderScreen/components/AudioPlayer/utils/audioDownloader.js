import { downloadFile, exists, DocumentDirectoryPath, unlink, mkdir } from "react-native-fs";
import { logError, logMessage } from "@common";
import { checkIsAudioRemoteExists, checkIsJsonRemoteExists } from "./checkHelper";

/**
 * Audio Downloader Utility
 *
 * Handles downloading audio tracks with progress tracking and file management
 */

// Audio files directory
const AUDIO_DIRECTORY = `${DocumentDirectoryPath}/audio`;

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

const ensureArtistDirectory = async (artistName) => {
  const audioDirectoryExists = await exists(AUDIO_DIRECTORY);

  if (!audioDirectoryExists) {
    await mkdir(AUDIO_DIRECTORY, { NSURLIsExcludedFromBackupKey: true });
  }

  const artistDirectory = `${AUDIO_DIRECTORY}/${artistName}`;
  const artistDirectoryExists = await exists(artistDirectory);

  if (!artistDirectoryExists) {
    await mkdir(artistDirectory, { NSURLIsExcludedFromBackupKey: true });
  }
};

const buildTrackPaths = (url) => {
  const { artistName, fileName } = generateFilename(url);
  const audioRelativePath = `${artistName}/${fileName}`;
  const fullAudioPath = `${AUDIO_DIRECTORY}/${audioRelativePath}`;
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
  const { skipDirectorySetup = false } = options;
  const { artistName, fileName, fullAudioPath, audioRelativePath } = buildTrackPaths(url);

  if (!skipDirectorySetup) {
    await ensureArtistDirectory(artistName);
  }

  const audioFileExists = await exists(fullAudioPath);
  if (audioFileExists) {
    logMessage(`Audio already downloaded: ${fileName}`);
    return { relativePath: audioRelativePath, alreadyExists: true, downloaded: false };
  }

  const audioRemoteExists = await checkIsAudioRemoteExists(url);
  if (!audioRemoteExists) {
    logError(`Audio source missing for ${trackTitle}`);
  }

  const audioDownloadTask = downloadFile({
    fromUrl: url,
    toFile: fullAudioPath,
    progressDivider: 1,
    begin: () => {
      logMessage(`Audio download started for: ${trackTitle}`);
    },
  });

  const audioResult = await audioDownloadTask.promise;

  if (audioResult.statusCode !== 200) {
    logError(`Audio download failed with status code: ${audioResult.statusCode}`);
  }

  const finalAudioExists = await exists(fullAudioPath);
  if (!finalAudioExists) {
    logError("Audio download completed but file was not created");
  }

  logMessage(`Audio download completed: ${fileName}`);
  return { relativePath: audioRelativePath, alreadyExists: false, downloaded: true };
};

export const downloadLyricsOnly = async (url, trackTitle, options = {}) => {
  const { skipDirectorySetup = false } = options;
  const { artistName, jsonFileName, jsonUrl, fullJsonPath, jsonRelativePath } =
    buildTrackPaths(url);

  if (!skipDirectorySetup) {
    await ensureArtistDirectory(artistName);
  }

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

  const jsonDownloadTask = downloadFile({
    fromUrl: jsonUrl,
    toFile: fullJsonPath,
    progressDivider: 1,
    begin: () => {
      logMessage(`Lyrics download started for: ${trackTitle}`);
    },
  });

  const jsonResult = await jsonDownloadTask.promise;

  if (jsonResult.statusCode !== 200) {
    logError(`Lyrics download failed with status code: ${jsonResult.statusCode}`);
  }

  const finalJsonExists = await exists(fullJsonPath);
  if (!finalJsonExists) {
    logError("Lyrics download completed but file was not created");
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
export const downloadTrack = async (url, trackTitle) => {
  try {
    const { artistName, fileName, jsonFileName } = buildTrackPaths(url);

    await ensureArtistDirectory(artistName);

    const audioResult = await downloadAudioOnly(url, trackTitle, { skipDirectorySetup: true });
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
