import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getBaniList } from "../../database/db";

const useBaniList = () => {
  const [baniListData, setBaniListData] = useState([]);
  const { transliterationLanguage } = useSelector((state) => state);
  useEffect(() => {
    (async () => {
      try {
        const transliteratedList = await getBaniList(transliterationLanguage);
        setBaniListData(transliteratedList);
      } catch (error) {
        console.log("Error eh wala ", error);
      }
    })();
  }, [transliterationLanguage]);
  return { baniListData };
};
export default useBaniList;
