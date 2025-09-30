import React from "react";
import { Button, View, Linking } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import RNRestart from "react-native-restart";
import { CustomText } from "@common";
import STRINGS from "../../localization";
import styles from "./styles";
import useScreenAnalytics from "../../hooks/useScreenAnalytics";
import constant from "../../constant";
import { logMessage } from "../../firebase/crashlytics";

const FallBack = () => {
  logMessage(constant.FALLBACK);
  const { container, title, text, btnWrap } = styles;
  useScreenAnalytics(constant.FALLBACK);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={container}>
        <CustomText style={title}>{STRINGS.errorTitle}</CustomText>
        <CustomText style={text}>{STRINGS.errorMessage}</CustomText>
        <View style={btnWrap}>
          <Button onPress={() => RNRestart.Restart()} title={STRINGS.errorReload} />
          <Button
            onPress={() => Linking.openURL("https://form.jotform.com/222881039684161")}
            title={STRINGS.errorReport}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};
export default FallBack;
