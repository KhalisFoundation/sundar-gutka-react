import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getShabadFromID } from "../../database/db";
import { setCacheShabad } from "../../common/actions";

const useFetchShabad = (shabadID) => {
  const dispatch = useDispatch();
  const [shabad, setShabad] = useState([]);
  const [isLoading, toggleLoading] = useState(false);
  const { baniLength, cacheShabad, transliterationLanguage } = useSelector((state) => state);
  useEffect(() => {
    (async () => {
      let data;

      if (cacheShabad[shabadID]) {
        data = cacheShabad[shabadID];
      } else {
        toggleLoading(true);
        data = await getShabadFromID(shabadID, baniLength, transliterationLanguage);
        if (data) {
          dispatch(setCacheShabad(data, shabadID));
        }
        toggleLoading(false);
      }
      setShabad(data);
    })();
  }, [shabadID]);

  return { shabad, isLoading };
};

export default useFetchShabad;
