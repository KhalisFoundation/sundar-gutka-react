import React, { useState } from "react";
import { Alert, Linking } from "react-native";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { REMINDER_SOUNDS } from "../../../common/actions/constant";
import { toggleReminders, setReminderSound } from "../../../common/actions";
import { STRINGS } from "../../../common";
import { nightModeStyles, iconNightColor } from "../../styles";
import { cancelAllReminders, checkPermissions } from "../../../common/notifications";
import { ListItemComponent, BottomSheetComponent } from "../comon";
import errorHandler from "../../../common/errHandler";
import FallBack from "../../../common/components/FallbackComponent";

function RemindersComponent({ navigation }) {
  const { isNightMode, isReminders, reminderSound } = useSelector((state) => state);
  const [isReminderSound, toggleReminderSound] = useState(false);
  const dispatch = useDispatch();
  const { navigate } = navigation;
  const { containerNightStyles, textNightStyle } = nightModeStyles(isNightMode);
  const iconColor = iconNightColor(isNightMode);
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

  const handleReminders = async (value) => {
    try {
      const isAllowed = await checkPermissions();

      if (!isAllowed) {
        dispatch(toggleReminders(false));
        redirectToSettings();
        cancelAllReminders();
        return;
      }
      dispatch(toggleReminders(value));
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
          action={setReminderSound}
        />
      )}
    </>
  );
}

RemindersComponent.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired }).isRequired,
};

export default RemindersComponent;
