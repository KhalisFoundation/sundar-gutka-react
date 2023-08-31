import { useEffect } from "react";
import { useSelector } from "react-redux";

const useSaveScroll = (isLayout, currentPage, readerRef, currentScrollPosition, shabadID) => {
  const { savePosition } = useSelector((state) => state);
  useEffect(() => {
    if (isLayout && currentPage && currentPage.length > 0) {
      const desiredScrollPosition = Number(savePosition[shabadID]) || undefined;
      if (desiredScrollPosition && desiredScrollPosition !== 0) {
        const autoScroll = setInterval(() => {
          if (readerRef.current) {
            readerRef.current.scrollTo({
              y: desiredScrollPosition,
              animated: true,
            });
          }
          if (currentScrollPosition.current >= desiredScrollPosition) {
            clearInterval(autoScroll);
          }
        }, 50);

        return () => clearInterval(autoScroll); // Cleanup the interval when the component unmounts or the dependencies change
      }
    }
    return () => clearInterval();
  }, [isLayout]);
};
export default useSaveScroll;
