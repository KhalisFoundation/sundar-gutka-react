import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getBookmarksForID } from "../../database/db";

const useBookmarks = (route) => {
  const { baniLength, transliterationLanguage } = useSelector((state) => state);
  const [data, setData] = useState([]);
  useEffect(() => {
    (async () => {
      const bookmarks = await getBookmarksForID(
        route.params.id,
        baniLength,
        transliterationLanguage
      );
      setData(bookmarks);
    })();
  }, []);
  return { data };
};
export default useBookmarks;
