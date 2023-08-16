import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { processData, convertToParagraph } from "../utils/util";

const usePagination = (data, itemsPerPage) => {
  const {
    isVishraam,
    isLarivaar,
    isLarivaarAssist,
    vishraamSource,
    vishraamOption,
    isParagraphMode,
  } = useSelector((state) => state);
  const [currentPage, setCurrentPage] = useState([]);

  const process = (shabad) => {
    let processShabad;
    processShabad = processData(
      shabad,
      isVishraam,
      isLarivaar,
      isLarivaarAssist,
      vishraamSource,
      vishraamOption
    );
    if (isParagraphMode) {
      processShabad = convertToParagraph(processShabad);
    }
    return processShabad;
  };

  useEffect(() => {
    const shabad = data.slice(0, itemsPerPage);
    setCurrentPage(process(shabad));
  }, [
    data,
    itemsPerPage,
    isVishraam,
    isLarivaar,
    isLarivaarAssist,
    vishraamSource,
    vishraamOption,
    isParagraphMode,
  ]);

  const fetchScrollData = (scrollPosition, scrollViewHeight, contentHeight) => {
    const isEndReached = scrollPosition + scrollViewHeight >= contentHeight - itemsPerPage;
    if (!isEndReached) {
      const nextPageItems = process(
        data.slice(currentPage.length, currentPage.length + itemsPerPage)
      );
      setCurrentPage((prevItems) => [...prevItems, ...nextPageItems]);
    }
  };

  return { currentPage, fetchScrollData };
};

export default usePagination;
