import { updateReminders, constant, trackReminderEvent, STRINGS } from "../../../../../common";
import { setReminderBanis } from "../../../../../common/actions";

const setDefaultReminders = async (baniListData, dispatch, isReminders, reminderSound) => {
  const baniList = baniListData;
  const defaultReminders = () => {
    return [
      {
        key: baniList[0].id,
        id: baniList[0].id,
        gurmukhi: baniList[0].gurmukhi,
        translit: baniList[0].translit,
        enabled: true,
        title: `${STRINGS.time_for} ${baniList[0].translit}`,
        time: "3:00 AM",
      },
      {
        key: baniList[1].id,
        id: baniList[1].id,
        gurmukhi: baniList[1].gurmukhi,
        translit: baniList[1].translit,
        enabled: true,
        title: `${STRINGS.time_for} ${baniList[1].translit}`,
        time: "3:30 AM",
      },
      {
        key: baniList[19].id,
        id: baniList[19].id,
        gurmukhi: baniList[19].gurmukhi,
        translit: baniList[19].translit,
        enabled: true,
        title: `${STRINGS.time_for} ${baniList[19].translit}`,
        time: "6:00 PM",
      },
      {
        key: baniList[21].id,
        id: baniList[21].id,
        gurmukhi: baniList[21].gurmukhi,
        translit: baniList[21].translit,
        enabled: true,
        title: `${STRINGS.time_for} ${baniList[21].translit}`,
        time: "10:00 PM",
      },
    ];
  };
  const data = defaultReminders(baniListData);

  dispatch(setReminderBanis(JSON.stringify(data)));

  await updateReminders(isReminders, reminderSound, JSON.stringify(data));
  trackReminderEvent(constant.RESET_REMINDER, true);
};

export default setDefaultReminders;
