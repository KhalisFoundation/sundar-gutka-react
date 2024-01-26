import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getBookmarksForID } from "../../database/db";

const useBookmarks = (route) => {
  const { baniLength } = useSelector((state) => state.baniLength);
  const { transliterationLanguage } = useSelector(state.transliterationLanguage);
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
