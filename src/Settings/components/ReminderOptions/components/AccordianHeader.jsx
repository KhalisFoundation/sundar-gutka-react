import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Switch, Icon, Divider } from "@rneui/themed";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import colors from "../../../../common/colors";
import constant from "../../../../common/constant";
import styles from "../styles";
import { setReminderBanis } from "../../../../common/actions";

function AccordianHeader({ section, isActive }) {
  const { isNightMode, isTransliteration } = useSelector((state) => state);
  const { reminderBanis } = useSelector((state) => state);
  const dispatch = useDispatch();

  const hanldeSwitchToggled = (value, key) => {
    const array = JSON.parse(reminderBanis);
    const targetIndex = array.findIndex((item) => item.key === Number(key));
    if (targetIndex !== -1) {
      array[targetIndex] = { ...array[targetIndex], enabled: value };
      const updatedArrayString = JSON.stringify(array);
      dispatch(setReminderBanis(updatedArrayString));
    }
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
          <TouchableOpacity onPress={() => {}}>
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
    </View>
  );
}
AccordianHeader.propTypes = {
  section: PropTypes.shape().isRequired,
  isActive: PropTypes.bool.isRequired,
};
export default AccordianHeader;
