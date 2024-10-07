import React from "react";
import { Button, Text, View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RNRestart from "react-native-restart";
import STRINGS from "../../localization";
import styles from "./styles";

const FallBack = () => {
  const { container, title, text, btnWrap } = styles;
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
