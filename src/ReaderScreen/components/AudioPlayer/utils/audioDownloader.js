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
    const filePath = `${AUDIO_DIRECTORY}/${artistName}/${fileName}`;

    const fileExists = await exists(filePath);
    return fileExists;
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

/**
 * Download audio track with progress tracking
 */
export const downloadTrack = async (url, trackTitle, onProgress, onComplete, onError) => {
  try {
    const { artistName, fileName } = generateFilename(url);
    const fullLocalPath = `${AUDIO_DIRECTORY}/${artistName}/${fileName}`;
    const relativePath = `${artistName}/${fileName}`;

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

    // Check if file already exists
    const fileExists = await exists(fullLocalPath);

    if (fileExists) {
      logMessage(`Track already downloaded: ${fileName}`);
      onComplete?.(relativePath);
      return relativePath;
    }

    logMessage(`Starting download: ${trackTitle}`);

    // Start download with progress tracking
    const downloadTask = downloadFile({
      fromUrl: url,
      toFile: fullLocalPath,
      progressDivider: 1,
      begin: () => {
        logMessage(`Download started for: ${trackTitle}`);
        onProgress?.(0);
      },
      progress: ({ contentLength, bytesWritten }) => {
        if (contentLength > 0) {
          const progress = Math.floor((bytesWritten / contentLength) * 100);
          onProgress?.(progress);
        }
      },
    });

    // Wait for download to complete
    const result = await downloadTask.promise;

    if (result.statusCode === 200) {
      // Verify file was actually created
      const finalFileExists = await exists(fullLocalPath);

      if (finalFileExists) {
        logMessage(`Download completed: ${fileName}`);
        onComplete?.(relativePath);
        return relativePath;
      }
      console.error("❌ Download completed but file doesn't exist!");
      throw new Error("Download completed but file was not created");
    }
    throw new Error(`Download failed with status: ${result.statusCode}`);
  } catch (error) {
    logError(`Download error for ${trackTitle}: ${error.message}`);

    // Clean up partial download if it exists
    try {
      const fullLocalPath = getFullLocalTrackPath(url);
      const fileExists = await exists(fullLocalPath);
      if (fileExists) {
        await unlink(fullLocalPath);
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
    const fileExists = await exists(url);

    if (fileExists) {
      await unlink(url);
      logMessage(`Deleted track: ${url}`);
      return true;
    }
    logMessage(`Track not found for deletion: ${url}`);
    return false;
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

/**
 * Show download success/failure messages
 */
// export const showDownloadMessage = (success, trackTitle, errorMessage = null) => {
//   if (success) {
//     Alert.alert(
//       "Download Complete",
//       `"${trackTitle}" has been downloaded successfully and is available for offline listening.`,
//       [{ text: "OK" }]
//     );
//   } else {
//     Alert.alert(
//       "Download Failed",
//       `Failed to download "${trackTitle}". ${
//         errorMessage || "Please check your internet connection and try again."
//       }`,
//       [{ text: "OK" }]
//     );
//   }
// };
