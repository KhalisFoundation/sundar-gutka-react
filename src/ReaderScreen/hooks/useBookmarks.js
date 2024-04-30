import { useEffect } from "react";

const useBookmarks = (webViewRef, shabad, bookmarkPosition) => {
  useEffect(() => {
    if (
      webViewRef.current &&
      webViewRef.current.postMessage &&
      Number(bookmarkPosition) !== -1 &&
      shabad.length > 0
    ) {
      webViewRef.current.postMessage(JSON.stringify({ bookmark: bookmarkPosition }));
    }
  }, [bookmarkPosition, webViewRef.current, shabad]);
};

export default useBookmarks;
