import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { processData, convertToParagraph } from "../utils";

const usePagination = (data) => {
  const itemsPerPage = data.length;
  const {
    isVishraam,
    isLarivaar,
    isLarivaarAssist,
    vishraamSource,
    vishraamOption,
    isParagraphMode,
  } = useSelector((state) => state);
  const [currentPage, setCurrentPage] = useState([]);
  const [currentPageLength, setCurrentPageLength] = useState(0);

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
  const loadRestData = () => {
    const multiplyItems = itemsPerPage * 2;
    const nextIndex = currentPageLength + multiplyItems;
    const nextPageItems = process(data.slice(currentPageLength, nextIndex));

    setCurrentPage((prevItems) => [...prevItems, ...nextPageItems]);

    setCurrentPageLength((prevLength) => prevLength + multiplyItems);
  };

  // useEffect(() => {
  //   if (currentPageLength < data.length) {
  //     setTimeout(() => {
  //       console.log("it's running");
  //       loadRestData();
  //     }, 1000);
  //   }
  // }, [currentPageLength]);

  useEffect(() => {
    const shabad = data.slice(0, itemsPerPage);
    setCurrentPage(process(shabad));
    setCurrentPageLength(shabad.length);
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
        data.slice(currentPageLength, currentPageLength + itemsPerPage)
      );
      setCurrentPage((prevItems) => [...prevItems, ...nextPageItems]);
      setCurrentPageLength(currentPageLength + itemsPerPage);
    }
  };

  return { currentPage, fetchScrollData };
};

export default usePagination;
