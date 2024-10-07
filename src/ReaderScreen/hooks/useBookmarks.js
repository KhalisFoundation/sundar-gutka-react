import { useEffect } from "react";

const useBookmarks = (scrollViewRef, shabad, bookmarkPosition, elementPositions) => {
  const scrollToElement = (id) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: elementPositions.current[id],
        animated: true,
      });
    }
  };
  useEffect(() => {
    scrollToElement(bookmarkPosition);
  }, [bookmarkPosition, scrollViewRef.current, shabad]);
};

export default useBookmarks;
