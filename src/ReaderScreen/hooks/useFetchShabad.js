import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getShabadFromID } from "../../database/db";
import { setCacheShabad } from "../../common/actions";

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
        // dispatch(setCacheShabad(data, shabadID));
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
