import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { errorHandler, FallBack } from "@common";
import { getBaniList } from "@database";
import setDefaultReminders from "../utils";

const useFetchBani = (setBaniListData, setReminderBaniData, setStateData, parsedReminderBanis) => {
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const dispatch = useDispatch();

  const fetchBani = async () => {
    try {
      const data = await getBaniList(transliterationLanguage);
      setBaniListData(data);

      if (parsedReminderBanis.length > 0) {
        const existingKeysSet = parsedReminderBanis.map((bani) => bani.key);
        const baniOptions = data
          .filter((object) => !existingKeysSet.includes(object.id))
          .map((bani) => ({
            key: bani.id,
            id: bani.id,
            label: isTransliteration ? bani.translit : bani.gurmukhi,
            gurmukhi: bani.gurmukhi,
            translit: bani.translit,
          }));
        setReminderBaniData(baniOptions);
      }
      if (parsedReminderBanis.length === 0) {
        await setDefaultReminders(data, dispatch, isReminders, reminderSound);
      } else {
        setStateData(parsedReminderBanis);
      }
    } catch (error) {
      errorHandler(error);
      FallBack();
    }
  };

  useEffect(() => {
    (async () => {
      if (transliterationLanguage) {
        await fetchBani();
      }
    })();
  }, [transliterationLanguage, reminderBanis]);
};
export default useFetchBani;
