import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { StatusBar, ScrollView, Text } from "react-native";
import {
  STRINGS,
  colors,
  useScreenAnalytics,
  constant,
  logMessage,
  StatusBarComponent,
  SafeArea,
  useRemote,
} from "@common";
import { nightModeStyles } from "./styles/nightModeStyles";
import FontSizeComponent from "./components/fontSize";
import FontFaceComponent from "./components/fontFace";
import LanguageComponent from "./components/language";
import TransliterationComponent from "./components/transliteration";
import ThemeComponent from "./components/theme";
import HideStatusBar from "./components/statusBar";
import BaniLengthComponent from "./components/baniLength";
import LarivaarComponent from "./components/larivaar";
import PadchedSettingsComponent from "./components/padched";
import VishraamComponent from "./components/vishraam";
import TranslationComponent from "./components/translation";
import RemindersComponent from "./components/reminders/reminders";
import AutoScroll from "./components/autoScroll";
import Audio from "./components/audio";
import KeepAwake from "./components/keepAwake";
import EditBaniOrder from "./components/editBaniOrder";
import ParagraphMode from "./components/paragraphMode";
import CollectStatistics from "./components/collectStatistics";
import Donate from "./components/donate";
import styles from "./styles/styles";
import ListItemWithIcon from "./components/comon/ListitemWithIcon";
import DatabaseUpdateBanner from "./components/databaseUpdate";

const Settings = ({ navigation }) => {
  const { IS_AUDIO_FEATURE_ENABLED } = useRemote();
  logMessage(constant.SETTINGS);
  useScreenAnalytics(constant.SETTINGS);
  const isNightMode = useSelector((state) => state.isNightMode);
  const isDatabaseUpdateAvailable = useSelector((state) => state.isDatabaseUpdateAvailable);

  const { navigate } = navigation;
  const { scrollViewNightStyles, backgroundNightStyle } = nightModeStyles(isNightMode);
  const { displayOptionsText, end } = styles;
  const { DISPLAY_OPTIONS, BANI_OPTIONS, OTHER_OPTIONS } = STRINGS;
  const language = useSelector((state) => state.language);
  const { about, databaseUpdate } = STRINGS;
  useEffect(() => {
    navigation.setOptions({
      title: STRINGS.settings,
    });
  }, [language]);

  return (
    <SafeArea backgroundColor={isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR}>
      <StatusBarComponent
        backgroundColor={
          !isNightMode ? colors.TOOLBAR_COLOR_ALT : colors.TOOLBAR_COLOR_ALT_NIGHT_MODE
        }
      />

      {isDatabaseUpdateAvailable && <DatabaseUpdateBanner navigate={navigate} />}
      <ScrollView>
        <Text style={[displayOptionsText, scrollViewNightStyles]}>{DISPLAY_OPTIONS}</Text>
        <FontSizeComponent />
        <FontFaceComponent />
        <LanguageComponent language={language} />
        <TransliterationComponent />
        <TranslationComponent />
        <ThemeComponent />
        <StatusBar />
        <HideStatusBar />
        <AutoScroll />
        <KeepAwake />
        {IS_AUDIO_FEATURE_ENABLED && <Audio />}
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
        <ListItemWithIcon
          iconName="info"
          title={about}
          navigate={navigate}
          navigationTarget="About"
        />
        <ListItemWithIcon
          iconName="update"
          title={databaseUpdate}
          navigate={navigate}
          navigationTarget="DatabaseUpdate"
        />
        <Text style={[end, backgroundNightStyle]} />
      </ScrollView>
    </SafeArea>
  );
};

Settings.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func, setOptions: PropTypes.func }).isRequired,
};

export default Settings;
