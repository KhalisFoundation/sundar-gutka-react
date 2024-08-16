import React from "react";
import { Text, ScrollView } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import STRINGS from "../common/localization";
import styles from "./styles/styles";
import FontSizeComponent from "./components/fontSize";
import FontFaceComponent from "./components/fontFace";
import LanguageComponent from "./components/language";
import TransliterationComponent from "./components/transliteration";
import ThemeComponent from "./components/theme";
import BaniLengthComponent from "./components/baniLength";
import LarivaarComponent from "./components/larivaar";
import PadchedSettingsComponent from "./components/padched";
import VishraamComponent from "./components/vishraam";
import TranslationComponent from "./components/translation";
import RemindersComponent from "./components/reminders/reminders";
import { nightModeStyles } from "./styles/nightModeStyles";
import StatusBar from "./components/statusBar";
import AutoScroll from "./components/autoScroll";
import KeepAwake from "./components/keepAwake";
import EditBaniOrder from "./components/editBaniOrder";
import ParagraphMode from "./components/paragraphMode";
import CollectStatistics from "./components/collectStatistics";
import Donate from "./components/donate";
import About from "./components/about";

function ListComponent({ navigation }) {
  const { navigate } = navigation;
  const isNightMode = useSelector((state) => state.isNightMode);
  const { scrollViewNightStyles, backgroundNightStyle } = nightModeStyles(isNightMode);
  const { displayOptionsText, end } = styles;
  const { DISPLAY_OPTIONS, BANI_OPTIONS, OTHER_OPTIONS } = STRINGS;
  const language = useSelector((state) => state.language);
  return (
    <ScrollView>
      <Text style={[displayOptionsText, scrollViewNightStyles]}>{DISPLAY_OPTIONS}</Text>
      <FontSizeComponent />
      <FontFaceComponent />
      <LanguageComponent language={language} />
      <TransliterationComponent />
      <TranslationComponent />
      <ThemeComponent />
      <StatusBar />
      <AutoScroll />
      <KeepAwake />
      {/* Bani Options */}
      <Text style={[displayOptionsText, scrollViewNightStyles]}>{BANI_OPTIONS}</Text>
      <EditBaniOrder navigate={navigate} isNightMode={isNightMode} />
      <BaniLengthComponent />
      <LarivaarComponent />
      <ParagraphMode />
      <PadchedSettingsComponent />
      <VishraamComponent />
      <RemindersComponent navigation={navigation} />

      <Text style={[displayOptionsText, scrollViewNightStyles]}>{OTHER_OPTIONS}</Text>
      <CollectStatistics />
      <Donate />
      <About navigate={navigate} />
      <Text style={[end, backgroundNightStyle]} />
    </ScrollView>
  );
}

ListComponent.propTypes = {
  navigation: PropTypes.shape().isRequired,
};

export default ListComponent;
