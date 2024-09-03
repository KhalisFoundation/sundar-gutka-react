import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import FallBack from "../../common/components/FallbackComponent";
import errorHandler from "../../common/errHandler";
import { getBaniList } from "../../database/db";
import orderedBani from "../../common/components/BaniList/baniOrderHelper";
import { setBaniList } from "../../common/actions";

const useBaniList = () => {
  const baniList = useSelector((state) => state.baniList);
  const baniOrder = useSelector((state) => state.baniOrder);
  const [baniListData, setBaniListData] = useState([]);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const prevLanguageRef = useRef(transliterationLanguage);
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchBaniList = async () => {
      try {
        const transliteratedList = await getBaniList(transliterationLanguage);
        const orderedData = orderedBani(transliteratedList, baniOrder);
        dispatch(setBaniList(orderedData));
        setBaniListData(orderedData);
      } catch (error) {
        errorHandler(error);
        FallBack();
      }
    };
    if (prevLanguageRef.current !== transliterationLanguage || baniList.length === 0) {
      fetchBaniList();
    } else {
      setBaniListData(baniList);
    }
  }, [transliterationLanguage, baniList]);
  return { baniListData };
};
export default useBaniList;
