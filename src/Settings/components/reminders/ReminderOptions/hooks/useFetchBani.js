import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logError, logMessage } from "@common";
import { getBaniList } from "@database";
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
        // Names are re-resolved from the database on every visit rather than
        // trusted from storage.
        //
        // A cloud restore writes reminders from the server payload, which only
        // carries the bani ID — it had been filling `gurmukhi` and `translit`
        // with empty strings, so after a restore every row rendered a blank
        // name. Backfilling here heals reminders already stored that way on a
        // device, which a fix at the writing end alone would not.
        //
        // `find` may legitimately miss: a bani can disappear from the database
        // across an update while a reminder for it is still stored. It used to
        // read `.translit` straight off the result, which threw and took the
        // whole screen down. Now the stored value stands in.
        setStateData(
          parsedReminderBanis.map((bani) => {
            const match = data.find((item) => item.id === bani.id);
            const translit = match?.translit || bani.translit || "";
            const gurmukhi = match?.gurmukhi || bani.gurmukhi || "";
            return {
              ...bani,
              translit,
              gurmukhi,
              label: isTransliteration ? translit : gurmukhi,
            };
          })
        );
      } else {
        await setDefaultReminders(data, dispatch, isReminders, reminderSound, isTransliteration);
      }
    } catch (error) {
      // Logged only. FallBack is the error-boundary SCREEN; calling a component
      // as a plain function runs its hooks outside React's render, so this catch
      // threw "Invalid hook call" over the failure it was reporting.
      logError(error);
      logMessage("fetchBani: Failed to fetch bani list");
    }
  }, [transliterationLanguage, reminderBanis, isTransliteration]);

  useEffect(() => {
    if (transliterationLanguage) {
      fetchBani();
    }
  }, [transliterationLanguage, reminderBanis]);
};
export default useFetchBani;
