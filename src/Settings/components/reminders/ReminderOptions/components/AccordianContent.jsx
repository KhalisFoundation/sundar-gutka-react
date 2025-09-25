import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Icon, Divider } from "@rneui/themed";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { STRINGS, colors, CustomText } from "@common";
import { setReminderBanis } from "@common/actions";
import { styles } from "../styles";
import LabelModal from "../modals/LabelModal";

const AccordianContent = ({ section, isActive }) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const [isLabelModal, toggleLabelModal] = useState(false);
  const reminderBanis = useSelector((state) => state.reminderBanis);
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
          <CustomText
            style={[
              styles.accContentText,
              { color: isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR },
            ]}
          >
            {title}
          </CustomText>
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
          <CustomText
            style={[
              { color: isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR },
            ]}
          >
            {STRINGS.delete}
          </CustomText>
        </View>
      </TouchableOpacity>
      <Divider color={colors.COMPONENT_COLOR_NIGHT_MODE} />
      {isLabelModal && <LabelModal section={section} onHide={hideModal} />}
    </View>
  );
};
AccordianContent.propTypes = {
  section: PropTypes.shape({ key: PropTypes.number.isRequired, title: PropTypes.string.isRequired })
    .isRequired,
  isActive: PropTypes.bool.isRequired,
};
export default AccordianContent;
