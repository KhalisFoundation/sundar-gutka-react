import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import DateTimePicker from "react-native-modal-datetime-picker";
import { useDispatch, useSelector } from "react-redux";
import { Switch, Icon, Divider } from "@rneui/themed";
import moment from "moment";
import PropTypes from "prop-types";
import { setReminderBanis } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { constant, updateReminders, trackReminderEvent, CustomText } from "@common";
import createStyles from "../styles";

const AccordianHeader = ({ section, isActive }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);

  const [isTimePicker, toggleTimePicker] = useState(false);
  const dispatch = useDispatch();
  const { enabled, translit, gurmukhi, key, time } = section;

  const handelSwitchToggled = async (value, keyItem) => {
    const array = JSON.parse(reminderBanis);
    const targetIndex = array.findIndex((item) => item.key === Number(keyItem));
    if (targetIndex !== -1) {
      array[targetIndex] = { ...array[targetIndex], enabled: value };
      const updatedArrayString = JSON.stringify(array);
      dispatch(setReminderBanis(updatedArrayString));
      await updateReminders(isReminders, reminderSound, JSON.stringify(updatedArrayString));
    }
  };
  const hideDateTimePicker = () => {
    toggleTimePicker(false);
  };

  const handleTimePicked = (timePicked) => {
    const array = JSON.parse(reminderBanis);
    const targetIndex = array.findIndex((item) => item.key === Number(key));
    if (targetIndex !== -1) {
      array[targetIndex] = {
        ...array[targetIndex],
        enabled: true,
        time: moment(timePicked).local().format("h:mm A"),
      };
    }
    dispatch(setReminderBanis(JSON.stringify(array)));
    hideDateTimePicker();
    updateReminders(isReminders, reminderSound, JSON.stringify(array));
    trackReminderEvent(constant.UPDATE_REMINDER, array[targetIndex]);
  };

  return (
    <View style={{ margin: 10 }}>
      <View style={styles.viewColumn}>
        <View style={styles.viewRow}>
          <CustomText
            style={[
              styles.cardTitle,
              !isTransliteration && { fontFamily: constant.GURBANI_AKHAR_TRUE },
              enabled ? { color: theme.colors.primaryText } : { color: theme.colors.disabledText },
            ]}
          >
            {isTransliteration ? translit : gurmukhi}
          </CustomText>
          <Switch value={enabled} onValueChange={(value) => handelSwitchToggled(value, key)} />
        </View>
        <View style={styles.viewRow}>
          <TouchableOpacity onPress={() => toggleTimePicker(true)}>
            <CustomText
              style={[
                styles.timeFont,
                enabled
                  ? { color: theme.colors.enabledText }
                  : { color: theme.colors.disabledText },
              ]}
            >
              {time}
            </CustomText>
          </TouchableOpacity>
          <Icon
            name={isActive ? "expand-less" : "expand-more"}
            color={theme.colors.componentColor}
            size={30}
          />
        </View>
        <Divider color={theme.colors.primaryText} />
      </View>
      <DateTimePicker
        modalPropsIOS={{
          supportedOrientations: [
            "portrait",
            "portrait-upside-down",
            "landscape-left",
            "landscape-right",
          ],
        }}
        isVisible={isTimePicker}
        onConfirm={(t) => handleTimePicked(t)}
        onCancel={hideDateTimePicker}
        is24Hour={false}
        mode="time"
      />
    </View>
  );
};
AccordianHeader.propTypes = {
  section: PropTypes.shape({
    enabled: PropTypes.bool.isRequired,
    key: PropTypes.number.isRequired,
    translit: PropTypes.string.isRequired,
    gurmukhi: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
};
export default AccordianHeader;
