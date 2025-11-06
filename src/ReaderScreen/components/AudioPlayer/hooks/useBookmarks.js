import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logMessage, logError, actions } from "@common";
import fetchLRCData from "../utils/fetchLRC";

const useBookmarks = (seekTo, url) => {
  const dispatch = useDispatch();
  const bookmarkSequenceString = useSelector((state) => state.bookmarkSequenceString);
  const isParagraphMode = useSelector((state) => state.isParagraphMode);

  // Helper function to get bookmark position from sequence string
  const getBookmarkSequenceString = useCallback(async (sequenceString, audioUrl, paragraphMode) => {
    try {
      // Early return if no bookmark sequence string exists
      if (!sequenceString || !audioUrl) {
        return null;
      }
      // Convert audio URL to JSON URL
      const jsonUrl = audioUrl.replace(".mp3", ".json");
      if (!jsonUrl || jsonUrl === audioUrl) {
        return null;
      }

      // Fetch LRC data
      const data = await fetchLRCData(jsonUrl);
      if (!data || !Array.isArray(data) || data.length === 0) {
        logMessage("LRC data not available or empty for bookmark sequence");
        return null;
      }

      // Extract sequence number based on mode
      let sequenceNumber = null;
      if (paragraphMode) {
        // Paragraph mode: sequence string format is "|123|456|" - extract first sequence
        const parts = sequenceString.split("|").filter((part) => part.trim() !== "");
        if (parts.length > 0) {
          sequenceNumber = Number(parts[0]);
        }
      } else {
        // Normal mode: sequence string is just the number
        sequenceNumber = Number(sequenceString);
      }

      // Validate sequence number
      if (
        !sequenceNumber ||
        !Number.isInteger(sequenceNumber) ||
        sequenceNumber < 1 ||
        Number.isNaN(sequenceNumber)
      ) {
        logError(`Invalid sequence number extracted: ${sequenceString}`);
        return null;
      }

      // Find the matching sequence in the data
      const matchingItem = data.find((item) => item.sequence === sequenceNumber);
      if (!matchingItem) {
        logMessage(`Sequence ${sequenceNumber} not found in LRC data`);
        return null;
      }

      // Validate that start time exists and is a number
      if (
        matchingItem.start == null ||
        typeof matchingItem.start !== "number" ||
        matchingItem.start < 0
      ) {
        logError(`Invalid start time for sequence ${sequenceNumber}`);
        return null;
      }

      logMessage(`Found bookmark position: ${matchingItem.start}s for sequence ${sequenceNumber}`);

      return matchingItem.start;
    } catch (error) {
      logError("Error getting bookmark sequence timestamp:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!bookmarkSequenceString || !url || !seekTo) {
      return;
    }

    const handleBookmark = async () => {
      const bookmarkPosition = await getBookmarkSequenceString(
        bookmarkSequenceString,
        url,
        isParagraphMode
      );

      if (bookmarkPosition != null && bookmarkPosition > 0) {
        await seekTo(bookmarkPosition);
        // Clear bookmark sequence string after successful use
        dispatch(actions.setBookmarkSequenceString(null));
      }
    };

    handleBookmark();
  }, [bookmarkSequenceString, url, isParagraphMode, seekTo]);
};

export default useBookmarks;
