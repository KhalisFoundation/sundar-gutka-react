import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Icon, Divider } from "@rneui/themed";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import colors from "../../../../common/colors";
import styles from "../styles";
import STRINGS from "../../../../common/localization";
import LabelModal from "../modals/LabelModal";
import { setReminderBanis } from "../../../../common/actions";

function AccordianContent({ section, isActive }) {
  const { isNightMode } = useSelector((state) => state);
  const [isLabelModal, toggleLabelModal] = useState(false);
  const { reminderBanis } = useSelector((state) => state);
  const dispatch = useDispatch();
  const { key, title } = section;
  let backColor;
  if (isActive) {
    backColor = isNightMode ? colors.ACTIVE_VIEW_COLOR_NIGHT_MODE : colors.ACTIVE_VIEW_COLOR;
  } else {
    backColor = isNightMode ? colors.INACTIVE_VIEW_COLOR_NIGHT_MODE : colors.INACTIVE_VIEW_COLOR;
  }
  const hideModal = () => {
    toggleLabelModal(false);
  };
  const handleDeleteReminder = (keyItem) => {
    const arr = JSON.parse(reminderBanis).filter((obj) => {
      return obj.key !== keyItem;
    });
    dispatch(setReminderBanis(JSON.stringify(arr)));
  };

  return (
    <View style={{ backgroundColor: backColor }}>
      <TouchableOpacity
        onPress={() => {
          toggleLabelModal(true);
        }}
      >
        <View style={styles.accContentWrapper}>
          <Icon
            name="turned-in-not"
            color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
            size={30}
          />
          <Text
            style={[
              styles.accContentText,
              { color: isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR },
            ]}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          handleDeleteReminder(key);
        }}
      >
        <View style={styles.accContentWrapper}>
          <Icon
            name="delete-outline"
            color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
            size={30}
          />
          <Text
            style={[
              { color: isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR },
            ]}
          >
            {STRINGS.delete}
          </Text>
        </View>
      </TouchableOpacity>
      <Divider color={colors.COMPONENT_COLOR_NIGHT_MODE} />
      {isLabelModal && <LabelModal section={section} onHide={hideModal} />}
    </View>
  );
}
AccordianContent.propTypes = {
  section: PropTypes.shape({ key: PropTypes.string.isRequired, title: PropTypes.string.isRequired })
    .isRequired,
  isActive: PropTypes.bool.isRequired,
};
export default AccordianContent;
