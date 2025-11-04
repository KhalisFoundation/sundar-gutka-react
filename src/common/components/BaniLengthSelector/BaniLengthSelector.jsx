import React from "react";
import { View, Pressable, Alert } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { CustomText, STRINGS, useThemedStyles, useTheme } from "@common";
import { setBaniLength } from "../../actions";
import createStyles from "./style";

const BaniLengthSelector = ({ navigation }) => {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const baniLengths = [STRINGS.short, STRINGS.medium, STRINGS.long, STRINGS.extra_long];
  const baniLength = useSelector((state) => state.baniLength);
  const dispatch = useDispatch();

  const handleOnpress = (length) => {
    dispatch(setBaniLength(length.toUpperCase()));
  };
  const baniLengthInfo = () => {
    Alert.alert(
      STRINGS.bani_length,
      `\n${STRINGS.bani_length_alert_1} \n${STRINGS.bani_length_alert_2} \n${STRINGS.bani_length_alert_3} \n${STRINGS.bani_length_alert_4} \n${STRINGS.bani_length_alert_5} \n${STRINGS.bani_length_alert_6} \n${STRINGS.bani_length_alert_7} \n${STRINGS.bani_length_alert_8} \n${STRINGS.bani_length_alert_9}`
    );
  };
  if (baniLength !== "") {
    navigation.navigate("MainTabs");
  }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.viewWrapper}>
          <CustomText style={styles.heading}>{STRINGS.khalsa_sundar_gutka}</CustomText>
          <CustomText style={styles.baniLengthMessage}>{STRINGS.bani_length_message_1}</CustomText>
          <CustomText style={styles.baniLengthMessage}>{STRINGS.bani_length_message_2}</CustomText>
          <CustomText style={styles.textPreferrence}>{STRINGS.choose_your_preference}</CustomText>
          {baniLengths.map((buttonText) => (
            <Pressable key={buttonText} onPress={() => handleOnpress(buttonText)}>
              <CustomText style={styles.button}>{buttonText}</CustomText>
            </Pressable>
          ))}
          <Pressable style={styles.helpWrapper} onPress={baniLengthInfo}>
            <Icon color={theme.colors.primaryVariant} name="info" size={30} />
            <CustomText style={styles.helpText}>{STRINGS.need_help_deciding}</CustomText>
            <CustomText style={styles.moreInfo}>{STRINGS.click_more_info}</CustomText>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};
export default BaniLengthSelector;

BaniLengthSelector.propTypes = {
  navigation: PropTypes.shape().isRequired,
};
