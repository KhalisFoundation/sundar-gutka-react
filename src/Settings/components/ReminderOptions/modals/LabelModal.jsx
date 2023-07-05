import React, { useState } from "react";
import { Modal, Text, TextInput, View, TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import colors from "../../../../common/colors";
import STRINGS from "../../../../common/localization";

function LabelModal({ section, onHide }) {
  const { title } = section;
  const [reminderTitle, setReminderTitle] = useState(title);
  const { isNightMode } = useSelector((state) => state);
  const confirmReminderLabel = () => {};

  return (
    <Modal visible transparent onRequestClose={onHide}>
      <View style={[{ flex: 1, justifyContent: "center", alignItems: "center" }]}>
        <View style={{ backgroundColor: colors.WHITE_COLOR }}>
          <Text>{STRINGS.notification_text}</Text>
          <TextInput
            style={isNightMode ? colors.MODAL_TEXT_NIGHT_MODE : colors.MODAL_TEXT}
            value={reminderTitle}
            onChangeText={(label) => setReminderTitle(label)}
            selectionColor={colors.MODAL_ACCENT_NIGHT_MODE}
          />

          <View>
            <TouchableOpacity
              onPress={() => {
                onHide();
              }}
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
LabelModal.propTypes = { section: PropTypes.shape().isRequired, onHide: PropTypes.func.isRequired };

export default LabelModal;
