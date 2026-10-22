import React from "react";
import { Linking } from "react-native";
import { STRINGS } from "@common";
import SettingsRow from "./comon/SettingsRow";

// Opens the donation page, as before. The in-app Seva screen this row will lead
// to arrives with the Seva PR, which repoints it there.
const Donate = () => (
  <SettingsRow
    title={STRINGS.donate}
    icon="volunteer-activism"
    onPress={() => Linking.openURL("https://khalisfoundation.org/donate/")}
  />
);

export default Donate;
