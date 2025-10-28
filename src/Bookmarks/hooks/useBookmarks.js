import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { logError, logMessage } from "@common";
import { getBookmarksForID } from "@database";

const useBookmarks = (route) => {
  const baniLength = useSelector((state) => state.baniLength);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const [bookmarksData, setBookmarksData] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const bookmarks = await getBookmarksForID(
          route.params.id,
          baniLength,
          transliterationLanguage
        );
        setBookmarksData(bookmarks);
      } catch (error) {
        logError(error);
        logMessage("useBookmarks: Failed to fetch bookmarks");
      }
    })();
  }, []);
  return { bookmarksData };
};
export default useBookmarks;
