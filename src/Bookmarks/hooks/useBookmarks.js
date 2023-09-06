import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getBookmarksForID } from "../../database/db";

const useBookmarks = (route) => {
  const { baniLength, transliterationLanguage } = useSelector((state) => state);
  const [bookmarksData, setBookmarksData] = useState([]);
  useEffect(() => {
    (async () => {
      const bookmarks = await getBookmarksForID(
        route.params.id,
        baniLength,
        transliterationLanguage
      );
      setBookmarksData(bookmarks);
    })();
  }, []);
  return { bookmarksData };
};
export default useBookmarks;
