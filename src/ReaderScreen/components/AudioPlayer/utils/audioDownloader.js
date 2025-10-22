import { Alert } from "react-native";
import { downloadFile, exists, DocumentDirectoryPath, unlink, mkdir } from "react-native-fs";
import { logError, logMessage } from "@common";

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

    // Both files must exist for the track to be considered downloaded
    return audioFileExists && jsonFileExists;
  } catch (error) {
    logError(`Error checking if track is downloaded: ${error.message}`);
    return false;
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

/**
 * Download audio track with progress tracking
 */
export const downloadTrack = async (url, trackTitle, onProgress, onComplete, onError) => {
  try {
    const { artistName, fileName } = generateFilename(url);
    const fullLocalPath = `${AUDIO_DIRECTORY}/${artistName}/${fileName}`;
    const relativePath = `${artistName}/${fileName}`;

    // Generate JSON lyrics file path
    const jsonFileName = fileName.replace(/\.[^/.]+$/, ".json"); // Replace extension with .json
    const fullJsonPath = `${AUDIO_DIRECTORY}/${artistName}/${jsonFileName}`;

    // Create directory if it doesn't exist
    const audioDirectoryExists = await exists(AUDIO_DIRECTORY);

    if (!audioDirectoryExists) {
      await mkdir(AUDIO_DIRECTORY, { NSURLIsExcludedFromBackupKey: true });
    }

    const artistDirectory = `${AUDIO_DIRECTORY}/${artistName}`;
    const artistDirectoryExists = await exists(artistDirectory);

    if (!artistDirectoryExists) {
      await mkdir(artistDirectory, { NSURLIsExcludedFromBackupKey: true });
    }

    // Check if both files already exist
    const audioFileExists = await exists(fullLocalPath);
    const jsonFileExists = await exists(fullJsonPath);

    if (audioFileExists && jsonFileExists) {
      logMessage(`Track and lyrics already downloaded: ${fileName}`);
      onComplete?.(relativePath);
      return relativePath;
    }

    logMessage(`Starting download: ${trackTitle}`);

    // Generate JSON URL from audio URL
    const jsonUrl = url.replace(/\.[^/.]+$/, ".json"); // Replace extension with .json

    // Download both files concurrently
    const downloadPromises = [];

    // Download audio file
    if (!audioFileExists) {
      const audioDownloadTask = downloadFile({
        fromUrl: url,
        toFile: fullLocalPath,
        progressDivider: 1,
        begin: () => {
          logMessage(`Audio download started for: ${trackTitle}`);
        },
        progress: ({ contentLength, bytesWritten }) => {
          if (contentLength > 0) {
            const progress = Math.floor((bytesWritten / contentLength) * 50); // Audio is 50% of total
            onProgress?.(progress);
          }
        },
      });
      downloadPromises.push(audioDownloadTask.promise);
    }

    // Download JSON lyrics file
    if (!jsonFileExists) {
      const jsonDownloadTask = downloadFile({
        fromUrl: jsonUrl,
        toFile: fullJsonPath,
        progressDivider: 1,
        begin: () => {
          logMessage(`Lyrics download started for: ${trackTitle}`);
        },
        progress: ({ contentLength, bytesWritten }) => {
          if (contentLength > 0) {
            const progress = Math.floor((bytesWritten / contentLength) * 50) + 50; // JSON is 50% of total
            onProgress?.(progress);
          }
        },
      });
      downloadPromises.push(jsonDownloadTask.promise);
    }

    // Wait for all downloads to complete
    const results = await Promise.all(downloadPromises);

    // Check if all downloads were successful
    const allSuccessful = results.every((result) => result.statusCode === 200);

    if (allSuccessful) {
      // Verify both files were actually created
      const finalAudioExists = await exists(fullLocalPath);
      const finalJsonExists = await exists(fullJsonPath);

      if (finalAudioExists && finalJsonExists) {
        logMessage(`Download completed: ${fileName} and ${jsonFileName}`);
        onComplete?.(relativePath);
        return relativePath;
      }
      logError("❌ Download completed but files don't exist!");
      throw new Error("Download completed but files were not created");
    }
    throw new Error(
      `Download failed with status codes: ${results.map((r) => r.statusCode).join(", ")}`
    );
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

    onError?.(error);
    throw error;
  }
};

/**
 * Delete downloaded track
 */
export const deleteTrack = async (url) => {
  try {
    const { artistName, fileName } = generateFilename(url);
    const audioFilePath = `${AUDIO_DIRECTORY}/${artistName}/${fileName}`;
    const jsonFileName = fileName.replace(/\.[^/.]+$/, ".json");
    const jsonFilePath = `${AUDIO_DIRECTORY}/${artistName}/${jsonFileName}`;

    let deletedFiles = 0;
    let totalFiles = 0;

    // Delete audio file
    const audioFileExists = await exists(audioFilePath);
    if (audioFileExists) {
      totalFiles += 1;
      await unlink(audioFilePath);
      deletedFiles += 1;
      logMessage(`Deleted audio file: ${fileName}`);
    }

    // Delete JSON lyrics file
    const jsonFileExists = await exists(jsonFilePath);
    if (jsonFileExists) {
      totalFiles += 1;
      await unlink(jsonFilePath);
      deletedFiles += 1;
      logMessage(`Deleted lyrics file: ${jsonFileName}`);
    }

    if (totalFiles === 0) {
      logMessage(`No files found for deletion: ${fileName}`);
      return false;
    }

    logMessage(`Successfully deleted ${deletedFiles}/${totalFiles} files for track: ${fileName}`);
    return deletedFiles === totalFiles;
  } catch (error) {
    logError(`Error deleting track ${url}: ${error.message}`);
    return false;
  }
};

/**
 * Show download confirmation dialog
 */
export const showDownloadConfirmation = (trackTitle, onConfirm, onCancel) => {
  Alert.alert(
    "Download Track",
    `Would you like to download "${trackTitle}" for offline listening?`,
    [
      {
        text: "Cancel",
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: "Download",
        onPress: onConfirm,
      },
    ]
  );
};
