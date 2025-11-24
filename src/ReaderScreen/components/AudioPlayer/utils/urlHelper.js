import { Platform } from "react-native";

/**
 * Format URL for TrackPlayer
 * Local files need proper file:// protocol on iOS
 */
export const formatUrlForTrackPlayer = (url) => {
  if (!url) return url;

  // If it's already a remote URL, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If it's a local file path, format it properly
  if (Platform.OS === "ios") {
    // iOS needs file:// protocol
    if (!url.startsWith("file://")) {
      const formattedUrl = `file://${url}`;
      return formattedUrl;
    }
  } else if (Platform.OS === "android") {
    // Android can handle file:// or direct paths
    if (!url.startsWith("file://") && !url.startsWith("/")) {
      const formattedUrl = `file://${url}`;
      return formattedUrl;
    }
  }

  return url;
};

/**
 * Check if URL is a local file
 */
export const isLocalFile = (url) => {
  if (!url) return false;
  return url.startsWith("file://") || url.startsWith("/");
};

/**
 * Get file extension from URL
 */
export const getFileExtension = (url) => {
  if (!url) return "";
  const parts = url.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
};

export const checkIsRemote = (url) => {
  return url.startsWith("http://") || url.startsWith("https://");
};

export const extractFilePath = (lyricsUrl) => {
  let filePath = lyricsUrl;
  if (lyricsUrl.startsWith("file://")) {
    // Remove file:// protocol, handling both file:///path and file://localhost/path
    // Regex matches: file:// followed by optional localhost/ (with trailing slash)
    filePath = lyricsUrl.replace(/^file:\/\/(localhost\/)?/, "");
    // Ensure path starts with / for absolute paths
    if (!filePath.startsWith("/")) {
      filePath = `/${filePath}`;
    }
  }
  return filePath;
};
