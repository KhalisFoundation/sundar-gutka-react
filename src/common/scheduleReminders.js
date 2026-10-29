import { showConfirm } from "./components";
import STRINGS from "./localization";
import { openExactAlarmSettings, updateReminders } from "./notifications";

/**
 * Write the reminder schedule to the OS, and tell the user if the OS refused.
 *
 * Every screen that changes reminders should call THIS rather than
 * `updateReminders` directly. On Android 12+ the exact-alarm permission is not
 * granted on install, and without it `createTriggerNotification` schedules
 * nothing and throws nothing — so the app happily showed reminders as "on"
 * while the system had none registered at all. Routing every caller through one
 * function means a new screen cannot reintroduce that silence by forgetting to
 * check.
 *
 * The prompt is a normal confirm, not a hard block: the user may genuinely want
 * to say no, and everything else about the screen still works if they do.
 *
 * `isTransliteration` rides along because the notification title is resolved
 * when the schedule is written, not when the reminder was created — see
 * common/reminders/title.
 *
 * @returns {Promise<{scheduled: number, blocked: boolean}>}
 */
const scheduleReminders = async (remindersOn, sound, remindersList, isTransliteration = false) => {
  const result = await updateReminders(remindersOn, sound, remindersList, isTransliteration);

  if (result?.blocked) {
    showConfirm({
      title: STRINGS.ALARM_PERM_TITLE,
      message: STRINGS.ALARM_PERM_BODY,
      cancelText: STRINGS.cancel,
      confirmText: STRINGS.OPEN_SETTINGS,
      onConfirm: openExactAlarmSettings,
    });
  }

  return result ?? { scheduled: 0, blocked: false };
};

export default scheduleReminders;
