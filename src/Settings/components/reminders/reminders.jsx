import React, { useState } from "react";
import { Alert, Linking } from "react-native";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import {
  STRINGS,
  cancelAllReminders,
  checkPermissions,
  errorHandler,
  actionConstants,
  actions,
  FallBack,
} from "../../../common";
import { nightModeStyles, iconNightColor } from "../../styles";
import { ListItemComponent, BottomSheetComponent } from "../comon";
import { getBaniList } from "../../../database/db";
import useDefaultReminders from "./ReminderOptions/hooks/useDefaultReminders";

function RemindersComponent({ navigation }) {
  const isNightMode = useSelector((state) => state.isNightMode);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);

  const [isReminderSound, toggleReminderSound] = useState(false);
  const dispatch = useDispatch();
  const { navigate } = navigation;
  const { containerNightStyles, textNightStyle } = nightModeStyles(isNightMode);
  const iconColor = iconNightColor(isNightMode);
  const setDefaultReminders = useDefaultReminders();
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
  const fetchBanis = async () => {
    const data = await getBaniList(transliterationLanguage);
    setDefaultReminders(data);
  };

  const handleReminders = async (value) => {
    try {
      const isAllowed = await checkPermissions();

      if (!isAllowed) {
        dispatch(actions.toggleReminders(false));
        redirectToSettings();
        cancelAllReminders();
        return;
      }
      dispatch(actions.toggleReminders(value));
      await fetchBanis();
      if (!value) {
        // disabling All Reminders
        cancelAllReminders();
      }
    } catch (error) {
      errorHandler(error);
      FallBack();
    }
  };

  return (
    <>
      <ListItem bottomDivider containerStyle={containerNightStyles}>
        <Icon color={iconColor} name="timer" size={30} />
        <ListItem.Content>
          <ListItem.Title style={textNightStyle}>{STRINGS.reminders}</ListItem.Title>
        </ListItem.Content>
        <Switch value={isReminders} onValueChange={(value) => handleReminders(value)} />
      </ListItem>

      {isReminders && (
        <ListItem
          bottomDivider
          containerStyle={containerNightStyles}
          onPress={() => navigate("ReminderOptions")}
        >
          <Icon name="event" color={iconColor} size={30} />
          <ListItem.Content>
            <ListItem.Title style={textNightStyle}>{STRINGS.set_reminder_options}</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
      )}
      {isReminders && (
        <ListItemComponent
          icon="speaker-phone"
          isAvatar={false}
          title={STRINGS.reminder_sound}
          value={reminderSound}
          actionConstant={actionConstants.REMINDER_SOUNDS}
          onPressAction={() => toggleReminderSound(true)}
        />
      )}
      {isReminderSound && (
        <BottomSheetComponent
          isVisible={isReminderSound}
          actionConstant={actionConstants.REMINDER_SOUNDS}
          value={reminderSound}
          toggleVisible={toggleReminderSound}
          title={STRINGS.reminder_sound}
          action={actions.setReminderSound}
        />
      )}
    </>
  );
}

RemindersComponent.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired }).isRequired,
};

export default RemindersComponent;
