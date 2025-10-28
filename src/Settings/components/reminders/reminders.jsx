import React, { useState } from "react";
import { Alert, Linking } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { ListItem, Icon, Switch } from "@rneui/themed";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
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
import createStyles from "../../styles";
import { ListItemComponent, BottomSheetComponent } from "../comon";
import { getReminderSound } from "../comon/strings";
import setDefaultReminders from "./ReminderOptions/utils";

const RemindersComponent = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
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
      <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
        <Icon color={theme.colors.primaryText} name="timer" size={30} />
        <ListItem.Content>
          <ListItem.Title style={styles.listItemTitle} allowFontScaling={false}>
            {STRINGS.reminders}
          </ListItem.Title>
        </ListItem.Content>
        <Switch value={isReminders} onValueChange={(value) => handleReminders(value)} />
      </ListItem>

      {isReminders && (
        <ListItem
          bottomDivider
          containerStyle={styles.containerNightStyles}
          onPress={() => navigate("ReminderOptions")}
        >
          <Icon name="event" color={theme.colors.primaryText} size={30} />
          <ListItem.Content>
            <ListItem.Title style={styles.listItemTitle} allowFontScaling={false}>
              {STRINGS.set_reminder_options}
            </ListItem.Title>
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
