import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logError, orderedBani, actions, logMessage } from "@common";
import { getBaniList } from "@database";

const useBaniList = () => {
  const baniList = useSelector((state) => state.baniList);
  const baniOrder = useSelector((state) => state.baniOrder);
  const [baniListData, setBaniListData] = useState([]);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const prevLanguageRef = useRef(transliterationLanguage);
  // Ref so fetchBaniList can read latest baniList without being in its deps (prevents re-trigger loop)
  const baniListRef = useRef(baniList);
  // Key of the fetch currently in flight, or null. Rehydration renews the
  // baniOrder reference (same content) right after mount, which re-created
  // fetchBaniList and re-ran the effect — so a fresh install ran the whole
  // DB query twice, back to back (measured on device). A fetch for the SAME
  // language and order is skipped while one is running; a genuinely different
  // one (language switch, reorder) still goes through.
  const inFlightKeyRef = useRef(null);
  useEffect(() => { baniListRef.current = baniList; }, [baniList]);
  const dispatch = useDispatch();

  const fetchBaniList = useCallback(async () => {
    const requestKey = `${transliterationLanguage}|${JSON.stringify(baniOrder)}`;
    if (inFlightKeyRef.current === requestKey) return;
    inFlightKeyRef.current = requestKey;
    logMessage("Fetching bani list");
    try {
      if (prevLanguageRef.current !== transliterationLanguage || baniListRef.current.length === 0) {
        const transliteratedList = await getBaniList(transliterationLanguage);
        const orderedData = orderedBani(transliteratedList, baniOrder, transliterationLanguage);
        dispatch(actions.setBaniList(orderedData));
        setBaniListData(orderedData);
      } else {
        setBaniListData(baniListRef.current);
      }
    } catch (error) {
      // Logged only. FallBack is the error-boundary SCREEN, and calling a
      // component as a plain function runs its hooks outside React's render —
      // so this catch used to throw "Invalid hook call" over the read error it
      // was reporting, hiding why the bani list came back empty.
      logError(error);
    } finally {
      inFlightKeyRef.current = null;
    }
  }, [transliterationLanguage, baniOrder]);

  useEffect(() => {
    fetchBaniList();
    prevLanguageRef.current = transliterationLanguage;
  }, [transliterationLanguage, fetchBaniList]);
  return { baniListData, fetchBaniList };
};
export default useBaniList;
