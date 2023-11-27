import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getShabadFromID } from "../../database/db";

const useFetchShabad = (shabadID) => {
  const [shabad, setShabad] = useState([]);
  const [isLoading, toggleLoading] = useState(false);
  const {
    baniLength,
    transliterationLanguage,
    vishraamSource,
    vishraamOption,
    isLarivaar,
    isLarivaarAssist,
    isParagraphMode,
    isVishraam,
  } = useSelector((state) => state);
  useEffect(() => {
    (async () => {
      toggleLoading(true);
      const data = await getShabadFromID(
        shabadID,
        baniLength,
        transliterationLanguage,
        vishraamSource,
        vishraamOption,
        isLarivaar,
        isLarivaarAssist,
        isParagraphMode,
        isVishraam
      );
      if (data) {
        toggleLoading(false);
        setShabad(data);
      }
    })();
  }, [
    shabadID,
    baniLength,
    transliterationLanguage,
    vishraamSource,
    vishraamOption,
    isLarivaar,
    isLarivaarAssist,
    isParagraphMode,
    isVishraam,
  ]);

  return { shabad, isLoading };
};

export default useFetchShabad;
