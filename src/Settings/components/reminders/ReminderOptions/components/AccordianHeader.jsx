import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Switch, Icon, Divider } from "@rneui/themed";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import DateTimePicker from "react-native-modal-datetime-picker";
import moment from "moment";
import colors from "../../../../../common/colors";
import constant from "../../../../../common/constant";
import styles from "../styles";
import { setReminderBanis } from "../../../../../common/actions";
import { updateReminders } from "../../../../../common/notifications";
import { trackReminderEvent } from "../../../../../common/analytics";

function AccordianHeader({ section, isActive }) {
  const { reminderBanis, isNightMode, isTransliteration, isReminders, reminderSound } = useSelector(
    (state) => state
  );
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
          <Text
            style={[
              styles.cardTitle,
              isNightMode && { color: colors.MODAL_TEXT_NIGHT_MODE },
              !isTransliteration && { fontFamily: constant.GURBANI_AKHAR_TRUE },
              !enabled && { color: colors.DISABLED_TEXT_COLOR_NIGHT_MODE },
            ]}
          >
            {isTransliteration ? translit : gurmukhi}
          </Text>
          <Switch value={enabled} onValueChange={(value) => handelSwitchToggled(value, key)} />
        </View>
        <View style={styles.viewRow}>
          <TouchableOpacity onPress={() => toggleTimePicker(true)}>
            <Text
              style={[
                styles.timeFont,
                isNightMode && { color: colors.MODAL_TEXT_NIGHT_MODE },
                enabled
                  ? { color: colors.ENABELED_TEXT_COLOR_NIGHT_MODE }
                  : { color: colors.DISABLED_TEXT_COLOR_NIGHT_MODE },
              ]}
            >
              {time}
            </Text>
          </TouchableOpacity>
          <Icon
            name={isActive ? "expand-less" : "expand-more"}
            color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
            size={30}
          />
        </View>
        <Divider color={colors.DISABLED_TEXT_COLOR_NIGHT_MODE} />
      </View>
      <DateTimePicker
        isVisible={isTimePicker}
        onConfirm={(t) => handleTimePicked(t)}
        onCancel={hideDateTimePicker}
        is24Hour={false}
        mode="time"
      />
    </View>
  );
}
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
