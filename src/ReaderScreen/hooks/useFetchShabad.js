import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { logError, logMessage } from "@common";
import { getShabadFromID } from "@database";

const useFetchShabad = (shabadID) => {
  const [shabad, setShabad] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const baniLength = useSelector((state) => state.baniLength);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const vishraamSource = useSelector((state) => state.vishraamSource);
  const vishraamOption = useSelector((state) => state.vishraamOption);
  const isLarivaar = useSelector((state) => state.isLarivaar);
  const isLarivaarAssist = useSelector((state) => state.isLarivaarAssist);
  const isParagraphMode = useSelector((state) => state.isParagraphMode);
  const isVishraam = useSelector((state) => state.isVishraam);

  const fetchShabad = useCallback(async () => {
    try {
      setLoading(true);
      if (shabadID) {
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
          setShabad(shabadData);
        } else {
          logMessage("useFetchShabad: Shabad Not Found");
        }
      }
    } catch (error) {
      logError(error);
      logMessage("useFetchShabad: Fetching shabad data error");
    } finally {
      setLoading(false);
    }
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
  useEffect(() => {
    fetchShabad();
  }, [fetchShabad]);

  return { shabad, isLoading, fetchShabad };
};

export default useFetchShabad;
