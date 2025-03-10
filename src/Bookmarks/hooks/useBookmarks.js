import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getBookmarksForID } from "@database";
import { errorHandler } from "@common";

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
        errorHandler(error, {
          context: "Fetching bookmarks data",
          location: "src/Bookmarks/hooks/useBookmarks.js",
          id: route.params.id,
          baniLength,
          transliterationLanguage,
        });
      }
    })();
  }, []);
  return { bookmarksData };
};
export default useBookmarks;
