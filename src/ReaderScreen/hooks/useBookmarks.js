import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setBookmarkPosition } from "@common/actions";

const useBookmarks = (webViewRef, shabad, bookmarkPosition, onJump) => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (
      webViewRef.current &&
      webViewRef.current.postMessage &&
      Number(bookmarkPosition) !== -1 &&
      shabad.length > 0
    ) {
      // Announce the jump BEFORE posting it.
      //
      // Tapping a bookmark dispatches the position and pops back to the Reader
      // in one handler, so this effect and the Reader's iOS focus listener run
      // off the same commit — and this one runs FIRST, because passive effects
      // run deepest-first and the listener is emitted by the navigator above.
      // That listener re-sends the position saved before Bookmarks opened,
      // landing on top of the jump and undoing it. Flagging first is what lets
      // it stand down.
      if (typeof onJump === "function") {
        onJump(bookmarkPosition);
      }
      webViewRef.current.postMessage(JSON.stringify({ bookmark: bookmarkPosition }));
      dispatch(setBookmarkPosition(-1));
    }
  }, [bookmarkPosition, webViewRef.current, shabad]);
};

export default useBookmarks;
