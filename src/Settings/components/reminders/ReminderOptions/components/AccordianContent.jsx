import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Icon, Divider } from "@rneui/themed";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { STRINGS } from "@common";
import { setReminderBanis } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import LabelModal from "../modals/LabelModal";
import createStyles from "../styles";

const AccordianContent = ({ section, isActive }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [isLabelModal, toggleLabelModal] = useState(false);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const dispatch = useDispatch();
  const { key, title } = section;

  const backColor = isActive ? theme.colors.activeView : theme.colors.inactiveView;

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
          <Icon name="turned-in-not" color={theme.colors.componentColor} size={30} />
          <Text style={[styles.accContentText]}>{title}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          handleDeleteReminder(key);
        }}
      >
        <View style={styles.accContentWrapper}>
          <Icon name="delete-outline" color={theme.colors.componentColor} size={30} />
          <Text style={{ color: theme.colors.componentColor }}>{STRINGS.delete}</Text>
        </View>
      </TouchableOpacity>
      <Divider color={theme.colors.primaryText} />
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
