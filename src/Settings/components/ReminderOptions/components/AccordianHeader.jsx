import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Switch, Icon, Divider } from "@rneui/themed";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import DateTimePicker from "react-native-modal-datetime-picker";
import moment from "moment";
import colors from "../../../../common/colors";
import constant from "../../../../common/constant";
import styles from "../styles";
import { setReminderBanis } from "../../../../common/actions";
import { updateReminders } from "../../../../common/notifications";

function AccordianHeader({ section, isActive }) {
  const { reminderBanis, isNightMode, isTransliteration, isReminders, reminderSound } = useSelector(
    (state) => state
  );
  const [isTimePicker, toggleTimePicker] = useState(false);
  const dispatch = useDispatch();

  const hanldeSwitchToggled = async (value, key) => {
    const array = JSON.parse(reminderBanis);
    const targetIndex = array.findIndex((item) => item.key === Number(key));
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

  const handleTimePicked = (time) => {
    const array = JSON.parse(reminderBanis);
    const targetIndex = array.findIndex((item) => item.key === Number(section.key));
    if (targetIndex !== -1)
      array[targetIndex] = {
        ...array[targetIndex],
        enabled: true,
        time: moment(time).local().format("h:mm A"),
      };
    dispatch(setReminderBanis(JSON.stringify(array)));
    hideDateTimePicker();
    updateReminders(isReminders, reminderSound, JSON.stringify(array));
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
              !section.enabled && { color: colors.DISABLED_TEXT_COLOR_NIGHT_MODE },
            ]}
          >
            {isTransliteration ? section.translit : section.gurmukhi}
          </Text>
          <Switch
            value={section.enabled}
            onValueChange={(value) => hanldeSwitchToggled(value, section.key)}
          />
        </View>
        <View style={styles.viewRow}>
          <TouchableOpacity onPress={() => toggleTimePicker(true)}>
            <Text
              style={[
                styles.timeFont,
                isNightMode && { color: colors.MODAL_TEXT_NIGHT_MODE },
                section.enabled
                  ? { color: colors.ENABELED_TEXT_COLOR_NIGHT_MODE }
                  : { color: colors.DISABLED_TEXT_COLOR_NIGHT_MODE },
              ]}
            >
              {section.time}
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
        onConfirm={(time) => handleTimePicked(time)}
        onCancel={hideDateTimePicker}
        is24Hour={false}
        mode="time"
      />
    </View>
  );
}
AccordianHeader.propTypes = {
  section: PropTypes.shape().isRequired,
  isActive: PropTypes.bool.isRequired,
};
export default AccordianHeader;
