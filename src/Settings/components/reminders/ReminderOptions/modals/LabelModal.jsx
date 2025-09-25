import React, { useState } from "react";
import { Modal, TextInput, View, TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { setReminderBanis } from "@common/actions";
import { updateReminders, colors, STRINGS, CustomText } from "@common";
import { styles } from "../styles";

const LabelModal = ({ section, onHide }) => {
  const { title } = section;
  const [reminderTitle, setReminderTitle] = useState(title);
  const isNightMode = useSelector((state) => state.isNightMode);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);

  const dispatch = useDispatch();

  const confirmReminderLabel = () => {
    const array = JSON.parse(reminderBanis);
    const index = array.findIndex((item) => item.key === section.key);
    if (index !== -1) array[index].title = reminderTitle;
    dispatch(setReminderBanis(JSON.stringify(array)));
    updateReminders(isReminders, reminderSound, JSON.stringify(array));
    onHide();
  };

  return (
    <Modal visible transparent onRequestClose={onHide}>
      <View style={styles.labelModalWrapper}>
        <View style={styles.labelViewWrapper}>
          <CustomText style={styles.labelText}>{STRINGS.notification_text}</CustomText>
          <TextInput
            style={[
              isNightMode ? colors.MODAL_TEXT_NIGHT_MODE : colors.MODAL_TEXT,
              styles.textInput,
            ]}
            value={reminderTitle}
            onChangeText={(label) => setReminderTitle(label)}
            selectionColor={colors.MODAL_ACCENT_NIGHT_MODE}
          />

          <View style={styles.labelButtonWrapper}>
            <TouchableOpacity
              onPress={() => {
                onHide();
              }}
              style={{ marginRight: 30 }}
            >
              <CustomText> {STRINGS.cancel}</CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                confirmReminderLabel();
                onHide();
              }}
            >
              <CustomText> {STRINGS.ok}</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
LabelModal.propTypes = {
  section: PropTypes.shape({ key: PropTypes.number.isRequired, title: PropTypes.string.isRequired })
    .isRequired,
  onHide: PropTypes.func.isRequired,
};

export default LabelModal;
