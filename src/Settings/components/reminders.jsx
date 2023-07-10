import React, { useState } from "react";
import { ListItem, Icon, Switch, BottomSheet } from "@rneui/themed";
import { Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { REMINDER_SOUNDS, toggleReminders, setReminderSound } from "../../common/actions";
import styles from "../styles";
import colors from "../../common/colors";
import STRINGS from "../../common/localization";

function RemindersComponent({ navigation }) {
  const { isNightMode, isReminders, reminderSound } = useSelector((state) => state);
  const [isReminderSound, toggleReminderSound] = useState(false);
  const dispatch = useDispatch();
  const { navigate } = navigation;
  const renderItem = (item) => {
    return (
      <ListItem
        key={item.key}
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
        onPress={() => {
          toggleReminderSound(false);
          dispatch(setReminderSound(item.key));
        }}
      >
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {item.title}
          </ListItem.Title>
        </ListItem.Content>
        {reminderSound === item.key && (
          <Icon color={isNightMode && colors.WHITE_COLOR} name="check" />
        )}
      </ListItem>
    );
  };

  return (
    <>
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Icon
          color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
          name="timer"
          size={30}
        />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.reminders}
          </ListItem.Title>
        </ListItem.Content>
        <Switch value={isReminders} onValueChange={(value) => dispatch(toggleReminders(value))} />
      </ListItem>

      {isReminders && (
        <ListItem
          bottomDivider
          containerStyle={[isNightMode && { backgroundColor: colors.NIGHT_GREY_COLOR }]}
          onPress={() => navigate("ReminderOptions")}
        >
          <Icon
            name="event"
            color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
            size={30}
          />
          <ListItem.Content>
            <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
              {STRINGS.set_reminder_options}
            </ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
      )}
      {isReminders && (
        <ListItem
          bottomDivider
          containerStyle={[isNightMode && { backgroundColor: colors.NIGHT_GREY_COLOR }]}
          onPress={() => {
            toggleReminderSound(true);
          }}
        >
          <Icon
            name="speaker-phone"
            size={30}
            color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
          />
          <ListItem.Content>
            <ListItem.Title
              style={{ color: isNightMode ? colors.WHITE_COLOR : colors.DISABLED_TEXT_COLOR }}
            >
              {STRINGS.reminder_sound}
            </ListItem.Title>
          </ListItem.Content>
          {reminderSound && (
            <ListItem.Title
              style={{ color: isNightMode ? colors.WHITE_COLOR : colors.DISABLED_TEXT_COLOR }}
            >
              {
                REMINDER_SOUNDS.filter((item) => item.key === reminderSound).map(
                  (item) => item.title
                )[0]
              }
            </ListItem.Title>
          )}
        </ListItem>
      )}
      {isReminderSound && (
        <BottomSheet modalProps={{}} isVisible={isReminderSound}>
          <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.reminder_sound}
          </Text>
          {REMINDER_SOUNDS.map((item) => renderItem(item))}
        </BottomSheet>
      )}
    </>
  );
}

RemindersComponent.propTypes = { navigation: PropTypes.shape().isRequired };

export default RemindersComponent;
