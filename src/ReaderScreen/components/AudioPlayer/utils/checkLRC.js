/**
 * Checks if a lyrics file (JSON) is available for the given audio URL
 * @param {string} audioUrl - The audio file URL (e.g., "https://example.com/audio.mp3")
 * @param {string} [jsonUrl] - Optional direct JSON URL. If not provided, will be derived from audioUrl
 * @returns {Promise<boolean>} - Returns true if lyrics file exists, false otherwise
 */
const checkLyricsFileAvailable = async (audioUrl, jsonUrl = null) => {
  try {
    // Use provided jsonUrl or derive it from audioUrl
    const lyricsUrl = jsonUrl || audioUrl?.replace(".mp3", ".json");

    if (!lyricsUrl) {
      return false;
    }

    // Use HEAD request for efficiency (only checks if file exists without downloading)
    const response = await fetch(lyricsUrl, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    // File doesn't exist or network error
    return false;
  }
};

export default checkLyricsFileAvailable;
