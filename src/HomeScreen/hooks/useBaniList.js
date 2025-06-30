import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logError, orderedBani, actions, logMessage, FallBack } from "@common";
import { getBaniList } from "@database";

const useBaniList = () => {
  const baniList = useSelector((state) => state.baniList);
  const baniOrder = useSelector((state) => state.baniOrder);
  const [baniListData, setBaniListData] = useState([]);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const prevLanguageRef = useRef(transliterationLanguage);
  const dispatch = useDispatch();

  const fetchBaniList = useCallback(async () => {
    logMessage("Fetching bani list");
    try {
      if (prevLanguageRef.current !== transliterationLanguage || baniList.length === 0) {
        const transliteratedList = await getBaniList(transliterationLanguage);
        const orderedData = orderedBani(transliteratedList, baniOrder);
        dispatch(actions.setBaniList(orderedData));
        setBaniListData(orderedData);
      } else {
        setBaniListData(baniList);
      }
    } catch (error) {
      logError(error);
      FallBack();
    }
  }, [transliterationLanguage, baniOrder, baniList]);

  useEffect(() => {
    fetchBaniList();
    prevLanguageRef.current = transliterationLanguage;
  }, [transliterationLanguage, fetchBaniList]);
  return { baniListData, fetchBaniList };
};
export default useBaniList;
