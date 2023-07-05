import React from "react";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { toggleReminders } from "../../common/actions";
import colors from "../../common/colors";
import STRINGS from "../../common/localization";

function RemindersComponent({ navigation }) {
  const { isNightMode, isReminders } = useSelector((state) => state);
  const dispatch = useDispatch();
  const { navigate } = navigation;
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
        </ListItem>
      )}
    </>
  );
}

RemindersComponent.propTypes = { navigation: PropTypes.shape().isRequired };

export default RemindersComponent;
