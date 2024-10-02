import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getShabadFromID } from "../../database/db";

const useFetchShabad = (shabadID) => {
  const [shabad, setShabad] = useState([]);
  const [isLoading, toggleLoading] = useState(false);
  const baniLength = useSelector((state) => state.baniLength);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const vishraamSource = useSelector((state) => state.vishraamSource);
  const vishraamOption = useSelector((state) => state.vishraamOption);
  const isLarivaar = useSelector((state) => state.isLarivaar);
  const isLarivaarAssist = useSelector((state) => state.isLarivaarAssist);
  const isParagraphMode = useSelector((state) => state.isParagraphMode);
  const isVishraam = useSelector((state) => state.isVishraam);
  useEffect(() => {
    const fetchShabad = async () => {
      toggleLoading(true);
      const shabadData = await getShabadFromID(
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
      if (shabadData) {
        toggleLoading(false);
        setShabad(shabadData);
      }
    };
    fetchShabad();
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
