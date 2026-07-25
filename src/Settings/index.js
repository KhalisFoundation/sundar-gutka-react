import React from "react";
import { StatusBar, ScrollView } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, StatusBarComponent, SafeArea, CustomText, useBackHandler } from "@common";
import Audio from "./components/audio";
import AutoScroll from "./components/autoScroll";
import BaniLengthComponent from "./components/baniLength";
import CollectStatistics from "./components/collectStatistics";
import ListItemWithIcon from "./components/comon/ListitemWithIcon";
import DatabaseUpdateBanner from "./components/databaseUpdate";
import Donate from "./components/donate";
import EditBaniOrder from "./components/editBaniOrder";
import FontFaceComponent from "./components/fontFace";
import FontSizeComponent from "./components/fontSize";
import KeepAwake from "./components/keepAwake";
import LanguageComponent from "./components/language";
import LarivaarComponent from "./components/larivaar";
import PadchedSettingsComponent from "./components/padched";
import ParagraphMode from "./components/paragraphMode";
import RemindersComponent from "./components/reminders/reminders";
import HideStatusBar from "./components/statusBar";
import ThemeComponent from "./components/theme";
import TranslationComponent from "./components/translation";
import TransliterationComponent from "./components/transliteration";
import VishraamComponent from "./components/vishraam";
import useHeader from "./hooks/useHeader";
import createStyles from "./styles";

const Settings = ({ navigation }) => {
  const appBar = useHeader(navigation);
  useBackHandler();
  const isDatabaseUpdateAvailable = useSelector((state) => state.isDatabaseUpdateAvailable);

  const { navigate } = navigation;
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { displayOptionsText, end } = styles;
  const { DISPLAY_OPTIONS, BANI_OPTIONS, OTHER_OPTIONS, AUDIO } = STRINGS;
  const language = useSelector((state) => state.language);
  const { about, databaseUpdate } = STRINGS;

  return (
    <SafeArea backgroundColor={theme.colors.surface} edges={["left", "right"]}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      {appBar}
      <LinearGradient
        colors={[
          "rgba(17,57,121,0)",
          "rgba(17,57,121,1)",
          "rgba(17,57,121,1)",
          "rgba(17,57,121,0)",
        ]}
        locations={[0, 0.48, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: "100%", height: 1.2 }}
      />
      {isDatabaseUpdateAvailable && <DatabaseUpdateBanner navigate={navigate} />}
      <ScrollView>
        <CustomText style={displayOptionsText}>{DISPLAY_OPTIONS}</CustomText>
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
        {/* Audio Player */}
        <CustomText style={displayOptionsText}>{AUDIO}</CustomText>
        <Audio />
        {/* Bani Options */}
        <CustomText style={displayOptionsText}>{BANI_OPTIONS}</CustomText>
        <EditBaniOrder navigate={navigate} />
        <BaniLengthComponent />
        <LarivaarComponent />
        <ParagraphMode />
        <PadchedSettingsComponent />
        <VishraamComponent />
        <RemindersComponent navigation={navigation} />
        <CustomText style={displayOptionsText}>{OTHER_OPTIONS}</CustomText>
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
        <CustomText style={end} />
      </ScrollView>
    </SafeArea>
  );
};

Settings.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func, setOptions: PropTypes.func }).isRequired,
};

export default Settings;
