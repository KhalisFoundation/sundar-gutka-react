import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setBookmarkPosition } from "../../common/actions";

const useBookmarks = (webViewRef, shabad, bookmarkPosition) => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (
      webViewRef.current &&
      webViewRef.current.postMessage &&
      Number(bookmarkPosition) !== -1 &&
      shabad.length > 0
    ) {
      webViewRef.current.postMessage(JSON.stringify({ bookmark: bookmarkPosition }));
      dispatch(setBookmarkPosition(-1));
    }
  }, [bookmarkPosition, webViewRef.current, shabad]);
};

export default useBookmarks;
