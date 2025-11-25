import { exists } from "react-native-fs";
import { checkIsRemote, extractFilePath } from "./urlHelper";

const checkLyricsFileAvailable = async (lyricsUrl = null) => {
  try {
    // Use provided jsonUrl or derive it from audioUrl

    if (!lyricsUrl) {
      return false;
    }

    // Check if the URL is remote (http/https) or local (file:// or absolute path)
    const isRemote = checkIsRemote(lyricsUrl);

    if (isRemote) {
      // Use HEAD request for efficiency (only checks if file exists without downloading)
      const response = await fetch(lyricsUrl, { method: "HEAD" });
      return response.ok;
    }

    // Local file - normalize file:// URL to absolute path for exists check
    const filePath = extractFilePath(lyricsUrl);
    const fileExists = await exists(filePath);
    return fileExists;
  } catch (error) {
    // File doesn't exist or network error
    return false;
  }
};

export default checkLyricsFileAvailable;
