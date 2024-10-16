import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { orderedBani, actions } from "@common";
import { getBaniList } from "@database";
import errorHandler from "../../common/errHandler";

const useBaniList = (setError) => {
  const baniList = useSelector((state) => state.baniList);
  const baniOrder = useSelector((state) => state.baniOrder);
  const [baniListData, setBaniListData] = useState([]);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const prevLanguageRef = useRef(transliterationLanguage);
  const dispatch = useDispatch();

  const fetchBaniList = useCallback(async () => {
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
      errorHandler(error);
      setError(error);
    }
  }, [transliterationLanguage, baniOrder, baniList]);

  useEffect(() => {
    fetchBaniList();
    prevLanguageRef.current = transliterationLanguage;
  }, [transliterationLanguage, fetchBaniList]);
  return { baniListData, fetchBaniList };
};
export default useBaniList;
