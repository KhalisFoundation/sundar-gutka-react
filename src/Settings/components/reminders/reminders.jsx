import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import useReminderPermissionGate from "@common/hooks/useReminderPermissionGate";
import { parseReminders } from "@common/reminders/syncModel";
import {
  STRINGS,
  cancelAllReminders,
  actions,
  logError,
  logMessage,
  scheduleReminders,
} from "@common";
import { getBaniList } from "@database";
import { ListItemComponent, BottomSheetComponent } from "../comon";
import SettingsRow, { SettingsToggleRow } from "../comon/SettingsRow";
import { getReminderSound } from "../comon/strings";
import setDefaultReminders from "./ReminderOptions/utils";

const RemindersComponent = ({ navigation }) => {
  const REMINDER_SOUNDS = getReminderSound(STRINGS);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const [isReminderSound, toggleReminderSound] = useState(false);

  const dispatch = useDispatch();
  const { navigate } = navigation;

  // The chosen sound is baked into every notification AT SCHEDULE TIME: on
  // Android it selects the channel, on iOS it names the sound file. Changing the
  // setting therefore does nothing to the reminders already sitting in the OS
  // queue — they keep firing with the old sound until the schedule is rewritten.
  //
  // That is why editing a reminder TIME appeared to fix the sound: it happened
  // to reschedule as a side effect. This does it for the sound change itself.
  const handleSoundChange = async (sound) => {
    if (!isReminders) return;
    try {
      await scheduleReminders(true, sound, reminderBanis, isTransliteration);
    } catch (error) {
      logError(error);
      logMessage("handleSoundChange: failed to reschedule reminders");
    }
  };

  const fetchBanis = async (value) => {
    const data = await getBaniList(transliterationLanguage);
    setDefaultReminders(data, dispatch, value, reminderSound, isTransliteration);
  };

  // Switching on keeps the list that is already there and only schedules it:
  // with an account, those reminders may have been set up on another phone, and
  // a reset here would delete them everywhere. Defaults seed an empty list only.
  const enableReminders = async () => {
    dispatch(actions.toggleReminders(true));
    if (parseReminders(reminderBanis).length) {
      await scheduleReminders(true, reminderSound, reminderBanis, isTransliteration);
    } else {
      await fetchBanis(true);
    }
  };

  // The switch is NOT turned on until every permission is actually there — a
  // reminder switch that reads ON while nothing can fire is the feature
  // silently not working. The checks, the dialogs and the return from system
  // settings live in the shared gate, which the Dashboard card uses too.
  //
  // The handlers read the CURRENT closures through a ref: the language and
  // sound the reminders are built with may have changed while the user was
  // away in settings.
  const latestRef = useRef({});
  const { resolvePermissions } = useReminderPermissionGate({
    onReturnGranted: () => latestRef.current.enableReminders(),
    onForeground: () => latestRef.current.verifyStillAllowed(),
  });

  // A permission taken away in system settings while the switch read ON would
  // leave it on with nothing able to fire. Turn it off and say why — once,
  // since the switch is off from here. Read-only: this runs without the user
  // having asked for anything, so it must never raise a system prompt.
  const verifyStillAllowed = async () => {
    if (!isReminders) return;
    if (await resolvePermissions()) return;
    await cancelAllReminders();
    dispatch(actions.toggleReminders(false));
  };
  latestRef.current = { enableReminders, verifyStillAllowed };

  useEffect(() => {
    // On opening Settings as well as on foreground. Revoking "Alarms &
    // reminders" KILLS the app, so there is no foreground event to catch that
    // one — the next thing that happens is a cold start, and this mount.
    verifyStillAllowed().catch(logError);
  }, []);

  const handleReminders = async (value) => {
    try {
      if (!value) {
        await cancelAllReminders();
        dispatch(actions.toggleReminders(false));
        return;
      }
      // The switch stays off until BOTH checks pass; nothing flips it on
      // early. It used to switch on after the notification check alone, so a
      // missing exact-alarm permission left it ON with nothing scheduled.
      if (!(await resolvePermissions(null, { prompt: true }))) {
        await cancelAllReminders();
        return;
      }
      await enableReminders();
    } catch (error) {
      // Logged only. FallBack is the error-boundary SCREEN; calling a component
      // as a plain function runs its hooks outside React's render, so this catch
      // threw "Invalid hook call" over the failure it was reporting.
      logError(error);
      logMessage("handleReminders: Failed to fetch banis");
    }
  };

  return (
    <>
      <SettingsToggleRow
        title={STRINGS.reminders}
        icon="timer"
        value={isReminders}
        onValueChange={(value) => handleReminders(value)}
      />

      {isReminders && (
        <SettingsRow
          title={STRINGS.set_reminder_options}
          icon="event"
          onPress={() => navigate("ReminderOptions")}
        />
      )}
      {isReminders && (
        <ListItemComponent
          icon="speaker-phone"
          isAvatar={false}
          title={STRINGS.reminder_sound}
          value={reminderSound}
          actionConstant={REMINDER_SOUNDS}
          onPressAction={() => toggleReminderSound(true)}
        />
      )}
      <BottomSheetComponent
        isVisible={isReminderSound}
        actionConstant={REMINDER_SOUNDS}
        value={reminderSound}
        toggleVisible={toggleReminderSound}
        title={STRINGS.reminder_sound}
        action={actions.setReminderSound}
        onChange={handleSoundChange}
      />
    </>
  );
};

RemindersComponent.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired }).isRequired,
};

export default RemindersComponent;
