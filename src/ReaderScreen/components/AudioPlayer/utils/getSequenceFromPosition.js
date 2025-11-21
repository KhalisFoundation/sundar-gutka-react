import { logError } from "@common";
import fetchLRCData from "./fetchLRC";

/**
 * Get the current sequence number from lyrics JSON based on audio position
 * @param {string} lyricsUrl - URL to the lyrics JSON file
 * @param {number} position - Current audio position in seconds
 * @returns {Promise<number|null>} - Sequence number or null if not found
 */
const getSequenceFromPosition = async (lyricsUrl, position) => {
  try {
    if (!lyricsUrl || position == null) {
      return null;
    }

    const lrcData = await fetchLRCData(lyricsUrl);
    if (!lrcData || !Array.isArray(lrcData) || lrcData.length === 0) {
      return null;
    }

    // Find the timestamp entry that contains the current position
    const currentTimestamp = lrcData.find(
      (timestamp) => position >= timestamp.start && position <= timestamp.end
    );

    return currentTimestamp ? currentTimestamp.sequence : null;
  } catch (error) {
    logError("Error getting sequence from position:", error);
    return null;
  }
};

/**
 * Get the position (start time) for a given sequence number from lyrics JSON
 * @param {string} lyricsUrl - URL to the lyrics JSON file
 * @param {number} sequence - Sequence number to find
 * @returns {Promise<number|null>} - Start position in seconds or null if not found
 */
const getPositionFromSequence = async (lyricsUrl, sequence) => {
  try {
    if (!lyricsUrl || sequence == null) {
      return null;
    }

    const lrcData = await fetchLRCData(lyricsUrl);
    if (!lrcData || !Array.isArray(lrcData) || lrcData.length === 0) {
      return null;
    }

    // Find the entry with the matching sequence
    const matchingEntry = lrcData.find((item) => item.sequence === sequence);

    return matchingEntry ? matchingEntry.start : null;
  } catch (error) {
    logError("Error getting position from sequence:", error);
    return null;
  }
};

export { getSequenceFromPosition, getPositionFromSequence };
