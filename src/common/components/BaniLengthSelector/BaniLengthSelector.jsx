import React, { useState } from "react";
import { View, Text, Modal, Pressable, Alert } from "react-native";
import { Icon } from "@rneui/themed";
import { useDispatch } from "react-redux";
import STRINGS from "../../localization";
import styles from "./style";
import colors from "../../colors";
import { setBaniLength } from "../../actions";

const BaniLengthSelector = () => {
  const [modalVissible, toggleModalVissible] = useState(true);
  const baniLengths = [STRINGS.short, STRINGS.medium, STRINGS.long, STRINGS.extra_long];
  const dispatch = useDispatch();

  const handleOnpress = (length) => {
    dispatch(setBaniLength(length.toUpperCase()));
    toggleModalVissible(false);
  };
  const baniLengthInfo = () => {
    Alert.alert(
      STRINGS.bani_length,
      `\n${STRINGS.bani_length_alert_1} \n${STRINGS.bani_length_alert_2} \n${STRINGS.bani_length_alert_3} \n${STRINGS.bani_length_alert_4} \n${STRINGS.bani_length_alert_5} \n${STRINGS.bani_length_alert_6} \n${STRINGS.bani_length_alert_7} \n${STRINGS.bani_length_alert_8} \n${STRINGS.bani_length_alert_9}`
    );
  };
  return (
    <Modal animationType="fade" visible={modalVissible}>
      <View style={styles.wrapper}>
        <View style={styles.viewWrapper}>
          <Text style={styles.heading}>{STRINGS.khalsa_sundar_gutka}</Text>
          <Text style={styles.baniLengthMessage}>{STRINGS.bani_length_message_1}</Text>
          <Text style={styles.baniLengthMessage}>{STRINGS.bani_length_message_2}</Text>
          <Text style={styles.textPreferrence}>{STRINGS.choose_your_preference}</Text>
          {baniLengths.map((buttonText) => (
            <Pressable key={buttonText} onPress={() => handleOnpress(buttonText)}>
              <Text style={styles.button}>{buttonText}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.helpWrapper} onPress={baniLengthInfo}>
            <Icon color={colors.TOOLBAR_COLOR_ALT} name="info" size={30} />
            <Text style={styles.helpText}>{STRINGS.need_help_deciding}</Text>
            <Text style={styles.moreInfo}>{STRINGS.click_more_info}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
export default BaniLengthSelector;
