import React, { useState } from "react";
import { Modal, Text, TextInput, View, TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import colors from "../../../../../common/colors";
import STRINGS from "../../../../../common/localization";
import { styles } from "../styles";
import { setReminderBanis } from "../../../../../common/actions";
import { updateReminders } from "../../../../../common/notifications";

function LabelModal({ section, onHide }) {
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
          <Text style={styles.labelText}>{STRINGS.notification_text}</Text>
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
              <Text> {STRINGS.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                confirmReminderLabel();
                onHide();
              }}
            >
              <Text> {STRINGS.ok}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
LabelModal.propTypes = {
  section: PropTypes.shape({ key: PropTypes.string.isRequired, title: PropTypes.string.isRequired })
    .isRequired,
  onHide: PropTypes.func.isRequired,
};

export default LabelModal;
