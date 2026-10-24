import { setReminderBanis } from "@common/actions";
import { reminderTitle } from "@common/reminders/title";
import { asAppWrite } from "@common/settings/appWrite";
import { scheduleReminders, constant, trackReminderEvent } from "@common";

export { isCustomTitle } from "@common/reminders/title";

/**
 * The reminder the edit sheet should show, read from the store as it is NOW.
 *
 * The sheet used to be handed the row object captured at tap time. Saving a
 * new title or time updated the store, but the sheet kept the snapshot — so
 * reopening "Notification Text" from the same sheet showed the OLD title, and
 * a second edit started from it. That is what "the text sometimes did not
 * save" was: it had saved, and the sheet was looking at a stale copy.
 *
 * `parsed` is the persisted list (source of truth for title/time/enabled),
 * `rows` the display list with the bani's translit/gurmukhi/label resolved.
 * Returns null once the reminder no longer exists, which closes the sheet.
 */
export const liveSection = (parsed, rows, editing) => {
  if (!editing) return null;
  const stored = (parsed || []).find((item) => item.key === editing.key);
  if (!stored) return null;
  const row = (rows || []).find((item) => item.key === editing.key);
  // The names come from the row, which re-resolved them from the database:
  // the stored copy can hold empty ones after a cloud restore (see
  // useFetchBani), and laid over the row it left the sheet with no bani name.
  return {
    ...editing,
    ...row,
    ...stored,
    translit: row?.translit || stored.translit,
    gurmukhi: row?.gurmukhi || stored.gurmukhi,
  };
};

const setDefaultReminders = async (
  baniListData,
  dispatch,
  isReminders,
  reminderSound,
  isTransliteration = false,
  // True when the APP fills an empty list, rather than the user asking for the
  // defaults back (Reset). The fill is not an edit: synced as one, its fresh
  // clocks outranked the account's own reminders for those banis, so opening
  // Reminders on a new phone overwrote the times set on the old one.
  { appWrite = false } = {}
) => {
  const baniList = baniListData;

  const defaultReminders = () => {
    const defaultIndexes = [0, 1, 19, 21];
    const defaultTimings = ["3:00 AM", "3:30 AM", "6:00 PM", "10:00 PM"];
    return defaultIndexes.map((index, idx) => {
      const bani = baniList[index];
      const item = {
        key: bani.id,
        id: bani.id,
        gurmukhi: bani.gurmukhi,
        gurmukhiUni: bani.gurmukhiUni,
        translit: bani.translit,
        enabled: true,
        time: defaultTimings[idx],
      };
      return { ...item, title: reminderTitle(item, isTransliteration) };
    });
  };
  const data = defaultReminders();

  const write = () => dispatch(setReminderBanis(JSON.stringify(data)));
  if (appWrite) asAppWrite(write);
  else write();

  await scheduleReminders(isReminders, reminderSound, JSON.stringify(data), isTransliteration);
  trackReminderEvent(constant.RESET_REMINDER, true);
};

export default setDefaultReminders;
