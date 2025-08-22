import React, { useState } from "react";
import { Modal, Text, TextInput, View, TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { setReminderBanis } from "@common/actions";
import { updateReminders, STRINGS } from "@common";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "../styles";

const LabelModal = ({ section, onHide }) => {
  const styles = useThemedStyles(createStyles);
  const { title } = section;
  const [reminderTitle, setReminderTitle] = useState(title);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const { theme } = useTheme();
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
            style={styles.textInput}
            value={reminderTitle}
            onChangeText={(label) => setReminderTitle(label)}
            selectionColor={theme.colors.underlayColor}
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
};
LabelModal.propTypes = {
  section: PropTypes.shape({ key: PropTypes.number.isRequired, title: PropTypes.string.isRequired })
    .isRequired,
  onHide: PropTypes.func.isRequired,
};

export default LabelModal;
