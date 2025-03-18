import { updateReminders, constant, trackReminderEvent, STRINGS } from "@common";
import { setReminderBanis } from "@common/actions";

const setDefaultReminders = async (baniListData, dispatch, isReminders, reminderSound) => {
  const baniList = baniListData;

  const defaultReminders = () => {
    const defaultIndexes = [0, 1, 19, 21];
    const defaultTimings = ["3:00 AM", "3:30 AM", "6:00 PM", "10:00 PM"];
    return defaultIndexes.map((index, idx) => {
      const bani = baniList[index];
      return {
        key: bani.id,
        id: bani.id,
        gurmukhi: bani.gurmukhi,
        translit: bani.translit,
        enabled: true,
        title: `${STRINGS.time_for} ${bani.translit}`,
        time: defaultTimings[idx],
      };
    });
  };
  const data = defaultReminders();

  dispatch(setReminderBanis(JSON.stringify(data)));

  await updateReminders(isReminders, reminderSound, JSON.stringify(data));
  trackReminderEvent(constant.RESET_REMINDER, true);
};

export default setDefaultReminders;
