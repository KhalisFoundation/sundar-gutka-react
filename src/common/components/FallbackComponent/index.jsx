import React from "react";
import { Button, Text, View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RNRestart from "react-native-restart";
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
    <SafeAreaView style={container}>
      <Text style={title}>{STRINGS.errorTitle}</Text>
      <Text style={text}>{STRINGS.errorMessage}</Text>
      <View style={btnWrap}>
        <Button onPress={() => RNRestart.Restart()} title={STRINGS.errorReload} />
        <Button
          onPress={() => Linking.openURL("https://form.jotform.com/222881039684161")}
          title={STRINGS.errorReport}
        />
      </View>
    </SafeAreaView>
  );
};
export default FallBack;
