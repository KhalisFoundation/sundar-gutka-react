import React, { useState } from "react";
import { Alert, Linking } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import {
  STRINGS,
  cancelAllReminders,
  checkPermissions,
  actions,
  logError,
  logMessage,
  FallBack,
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
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const [isReminderSound, toggleReminderSound] = useState(false);

  const dispatch = useDispatch();
  const { navigate } = navigation;

  const redirectToSettings = async () => {
    Alert.alert(STRINGS.permissionTitle, STRINGS.premissionDescription, [
      {
        text: STRINGS.cancel,
        style: "cancel",
      },
      {
        text: STRINGS.openSettings,
        onPress: () => Linking.openSettings(),
      },
    ]);
  };
  const fetchBanis = async (value) => {
    const data = await getBaniList(transliterationLanguage);
    setDefaultReminders(data, dispatch, value, reminderSound);
  };

  const handleReminders = async (value) => {
    try {
      if (!value) {
        // disabling All Reminders
        await cancelAllReminders();
        dispatch(actions.toggleReminders(value));
        return;
      }

      const isAllowed = await checkPermissions();
      if (!isAllowed) {
        dispatch(actions.toggleReminders(false));
        redirectToSettings();
        await cancelAllReminders();
        return;
      }

      dispatch(actions.toggleReminders(value));
      await fetchBanis(value);
    } catch (error) {
      logError(error);
      logMessage("handleReminders: Failed to fetch banis");
      FallBack();
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
      {isReminderSound && (
        <BottomSheetComponent
          isVisible={isReminderSound}
          actionConstant={REMINDER_SOUNDS}
          value={reminderSound}
          toggleVisible={toggleReminderSound}
          title={STRINGS.reminder_sound}
          action={actions.setReminderSound}
        />
      )}
    </>
  );
};

RemindersComponent.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired }).isRequired,
};

export default RemindersComponent;
