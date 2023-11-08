import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleBookmarks } from "../../common/actions";

const useBookmarks = (readerRef, shabad) => {
  const { bookmarkPosition, bookmarks } = useSelector((state) => state);

  const dispatch = useDispatch();
  useEffect(() => {
    if (bookmarks) {
      const index = shabad.findIndex((item) => item.id === bookmarkPosition);
      console.log("Index", index);
      readerRef.current?.scrollToIndex({ index });
      dispatch(toggleBookmarks(false));
    }
  }, [bookmarks]);
};

export default useBookmarks;
