import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBaniList } from "@database";
import errorHandler from "@common";
import setDefaultReminders from "../utils";

const useFetchBani = (setBaniListData, setReminderBaniData, setStateData, parsedReminderBanis) => {
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const dispatch = useDispatch();

  const fetchBani = useCallback(async () => {
    try {
      const data = await getBaniList(transliterationLanguage);
      setBaniListData(data);
      const existingKeysSet = parsedReminderBanis.map((bani) => bani.key);
      const baniOptions = data
        // Filter out keys for which a reminder has not been created. Ensure that the baniList ID is less than 1000, as we do not manage any bani with IDs greater than 1000.
        .filter((object) => !existingKeysSet.includes(object.id) && object.id < 1001)
        .map((bani) => ({
          key: bani.id,
          id: bani.id,
          label: isTransliteration ? bani.translit : bani.gurmukhi,
          gurmukhi: bani.gurmukhi,
          translit: bani.translit,
        }));
      // setting reminder data for modal Selector to create new reminder
      setReminderBaniData(baniOptions);
      if (parsedReminderBanis.length > 0) {
        // setting reminder data for accordian or reminder data selected by user
        setStateData(
          parsedReminderBanis.map((bani) => ({
            ...bani,
            translit: data.find((key) => key.id === bani.id).translit,
            label: isTransliteration ? bani.translit : bani.gurmukhi,
          }))
        );
      } else {
        await setDefaultReminders(data, dispatch, isReminders, reminderSound);
      }
    } catch (error) {
      errorHandler(error);
      throw new Error(error);
    }
  }, [transliterationLanguage, reminderBanis, isTransliteration]);

  useEffect(() => {
    if (transliterationLanguage) {
      fetchBani();
    }
  }, [transliterationLanguage, reminderBanis]);
};
export default useFetchBani;
