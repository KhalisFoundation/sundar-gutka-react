// useDefaultReminders.js
import { useDispatch, useSelector } from "react-redux";
import { defaultReminders } from "../utils/helpers";
import { setReminderBanis } from "../../../../../common/actions";
import { updateReminders } from "../../../../../common/notifications";
import { trackReminderEvent, constant } from "../../../../../common";

const useDefaultReminders = (setStateData = undefined) => {
  const dispatch = useDispatch();

  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const setDefaultReminders = async (baniListData) => {
    const data = defaultReminders(baniListData);

    dispatch(setReminderBanis(JSON.stringify(data)));
    if (typeof setStateData === "function") {
      setStateData(data);
    }

    await updateReminders(isReminders, reminderSound, JSON.stringify(data));
    trackReminderEvent(constant.RESET_REMINDER, true);
  };

  return setDefaultReminders;
};

export default useDefaultReminders;
