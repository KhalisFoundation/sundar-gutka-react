import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getBaniList } from "../../database/db";

const useBaniList = () => {
  const [data, setData] = useState([]);
  const { transliterationLanguage } = useSelector;
  useEffect(() => {
    (async () => {
      try {
        const d = await getBaniList(transliterationLanguage);
        setData(d);
      } catch (error) {
        console.log("Error eh wala ", error);
      }
    })();
  }, [transliterationLanguage]);
  return { data };
};
export default useBaniList;
