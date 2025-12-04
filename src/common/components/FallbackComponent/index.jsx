import React, { useEffect } from "react";
import { Button, View, Linking } from "react-native";
import RNRestart from "react-native-restart";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { CustomText } from "@common";
import constant from "../../constant";
import { trackScreenView } from "../../firebase/analytics";
import { logMessage } from "../../firebase/crashlytics";
import STRINGS from "../../localization";
import createStyles from "./styles";

const FallBack = () => {
  const styles = useThemedStyles(createStyles);
  const { container, title, text, btnWrap } = styles;

  useEffect(() => {
    // Track screen view when error fallback is shown
    trackScreenView("ErrorFallback", null, "Error Boundary Fallback Screen");
    // Log to Crashlytics
    logMessage(constant.FALLBACK);
  }, []);
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
