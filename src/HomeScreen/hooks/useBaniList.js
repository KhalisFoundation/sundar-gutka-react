import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import FallBack from "../../common/components/FallbackComponent";
import errorHandler from "../../common/errHandler";
import { getBaniList } from "../../database/db";

const useBaniList = () => {
  const [baniListData, setBaniListData] = useState([]);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  useEffect(() => {
    (async () => {
      try {
        const transliteratedList = await getBaniList(transliterationLanguage);
        setBaniListData(transliteratedList);
      } catch (error) {
        errorHandler(error);
        FallBack();
      }
    })();
  }, [transliterationLanguage]);
  return { baniListData };
};
export default useBaniList;
