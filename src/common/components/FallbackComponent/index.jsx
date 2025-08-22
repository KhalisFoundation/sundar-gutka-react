import React from "react";
import { Button, Text, View, Linking } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import RNRestart from "react-native-restart";
import useThemedStyles from "@common/hooks/useThemedStyles";
import STRINGS from "../../localization";
import useScreenAnalytics from "../../hooks/useScreenAnalytics";
import constant from "../../constant";
import { logMessage } from "../../firebase/crashlytics";
import createStyles from "./styles";

const FallBack = () => {
  const styles = useThemedStyles(createStyles);
  logMessage(constant.FALLBACK);
  const { container, title, text, btnWrap } = styles;
  useScreenAnalytics(constant.FALLBACK);
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
};
export default FallBack;
