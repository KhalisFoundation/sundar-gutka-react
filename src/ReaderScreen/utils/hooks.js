import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getShabadFromID } from "../../database/db";
import { convertToParagraph, processData } from "./util";
import { setCacheShabad } from "../../common/actions";

export const useFetchShabad = (shabadID) => {
  const dispatch = useDispatch();
  const [shabad, setShabad] = useState([]);
  const [isLoading, toggleLoading] = useState(false);
  const { baniLength, cacheShabad, transliterationLanguage } = useSelector((state) => state);
  useEffect(() => {
    (async () => {
      let data;

      if (cacheShabad[shabadID]) {
        data = cacheShabad[shabadID];
      } else {
        toggleLoading(true);
        data = await getShabadFromID(shabadID, baniLength, transliterationLanguage);
        if (data) {
          dispatch(setCacheShabad(data, shabadID));
        }
        toggleLoading(false);
      }
      setShabad(data);
    })();
  }, [shabadID]);

  return { shabad, isLoading };
};

export const usePagination = (data, itemsPerPage) => {
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

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;

    const isEndReached = scrollPosition + scrollViewHeight >= contentHeight - itemsPerPage;
    if (!isEndReached) {
      const nextPageItems = process(
        data.slice(currentPage.length, currentPage.length + itemsPerPage)
      );
      setCurrentPage((prevItems) => [...prevItems, ...nextPageItems]);
    }
  };

  return { currentPage, handleScroll };
};
