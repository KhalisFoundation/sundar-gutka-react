import React from "react";
import { useNavigation } from "@react-navigation/native";
import { STRINGS } from "@common";
import SettingsRow from "./comon/SettingsRow";

// Opens the in-app Seva screen rather than throwing the user out to a browser.
// Seva already owns the amount and frequency choice and hands off to the
// donation form itself, so sending them straight to the bare form from here
// both skipped that context and left the app.
const Donate = () => {
  const navigation = useNavigation();

  return (
    <SettingsRow
      title={STRINGS.donate}
      icon="volunteer-activism"
      // Targets the tab NAVIGATOR and the screen inside it, not a bare "Seva".
      //
      // Settings is registered twice: once as a tab and once as a stack screen.
      // Opened from the Reader — where the bar shows Read/Audios — it is the
      // STACK copy, and that navigator has no Seva route, so a bare
      // navigate("Seva") had nothing to resolve against. Naming the parent works
      // from both, because React Navigation already inside MainTabs simply
      // switches tab.
      onPress={() => navigation.navigate("MainTabs", { screen: "Seva" })}
    />
  );
};

export default Donate;
