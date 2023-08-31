import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setBookmarkPosition } from "../../common/actions";

const useBookmarks = (readerRef, shabad, bookmarkPosition, rowHeights, layoutHeight) => {
  const animationDelayTime = 50;
  const dispatch = useDispatch();
  useEffect(() => {
    if (bookmarkPosition !== 0) {
      const index = shabad.findIndex((item) => item.id === bookmarkPosition);
      const scrollBookmark = setInterval(() => {
        readerRef.current?.scrollTo({ y: layoutHeight.current, animated: true });
        if (index > 0 && rowHeights.length >= index) {
          clearInterval(scrollBookmark);
          const position = rowHeights.slice(0, index).reduce((a, b) => a + b, 0);
          readerRef.current?.scrollTo({ y: position, animated: true });
          dispatch(setBookmarkPosition(0));
        }
      }, animationDelayTime);
    }
  }, [bookmarkPosition]);
};

export default useBookmarks;
