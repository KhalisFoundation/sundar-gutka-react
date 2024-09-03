import { useEffect } from "react";
import { useSelector } from "react-redux";
import { getBaniList } from "../../../../../database/db";
import { errorHandler } from "../../../../../common";
import { FallBack } from "../../../../../common/components";

const useFetchBani = (
  setBaniListData,
  setReminderBaniData,
  setStateData,
  parsedReminderBanis,
  setDefaultReminders
) => {
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isTransliteration = useSelector((state) => state.isTransliteration);

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
        await setDefaultReminders(data);
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
