import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FallBack, errorHandler, orderedBani, actions } from "@common";
import { getBaniList } from "@database";

const useBaniList = () => {
  const baniList = useSelector((state) => state.baniList);
  const baniOrder = useSelector((state) => state.baniOrder);
  const [baniListData, setBaniListData] = useState([]);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const prevLanguageRef = useRef(transliterationLanguage);
  const dispatch = useDispatch();

  const fetchBaniList = useCallback(async () => {
    try {
      const transliteratedList = await getBaniList(transliterationLanguage);
      const orderedData = orderedBani(transliteratedList, baniOrder);
      dispatch(actions.setBaniList(orderedData));
      setBaniListData(orderedData);
    } catch (error) {
      errorHandler(error);
      FallBack();
    }
  }, [transliterationLanguage, baniOrder]);

  useEffect(() => {
    if (prevLanguageRef.current !== transliterationLanguage || baniList.length === 0) {
      fetchBaniList();
    } else {
      setBaniListData(baniList);
    }
    prevLanguageRef.current = transliterationLanguage;
  }, [transliterationLanguage, baniList]);
  return { baniListData };
};
export default useBaniList;
