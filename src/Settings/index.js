import React from "react";
import { Animated, View } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import {
  STRINGS,
  StatusBarComponent,
  SafeArea,
  GradientDivider,
  useCustomScrollbar,
  useBackHandler,
  BottomNavigation,
  constant,
} from "@common";
import { ScreenHeader } from "../common/components/ui";
import Account from "./components/account";
import Audio from "./components/audio";
import AutoScroll from "./components/autoScroll";
import BaniFontFaceComponent from "./components/baniFontFace";
import BaniLengthComponent from "./components/baniLength";
import CollectStatistics from "./components/collectStatistics";
import ListItemWithIcon from "./components/comon/ListitemWithIcon";
import { SettingsSection } from "./components/comon/SettingsRow";
import DatabaseUpdateBanner from "./components/databaseUpdate";
import Donate from "./components/donate";
import EditBaniOrder from "./components/editBaniOrder";
import FontSizeComponent from "./components/fontSize";
import KeepAwake from "./components/keepAwake";
import LanguageComponent from "./components/language";
import LarivaarComponent from "./components/larivaar";
import PadchedSettingsComponent from "./components/padched";
import ParagraphMode from "./components/paragraphMode";
import RemindersComponent from "./components/reminders/reminders";
import RevisitTutorial from "./components/revisitTutorial";
import HideStatusBar from "./components/statusBar";
import ThemeComponent from "./components/theme";
import TranslationComponent from "./components/translation";
import TransliterationComponent from "./components/transliteration";
import VishraamComponent from "./components/vishraam";

const Settings = ({ navigation, route = undefined }) => {
  const fromReader = route?.params?.fromReader === true;
  // Settings is reachable several ways: pushed onto the root stack (from the
  // Reader OR a Folder) where goBack() pops correctly, OR as a bottom tab from
  // Home where there is no back stack. canGoBack() distinguishes them reliably
  // for every entry path — only the tab case (no stack to pop) falls back to the
  // Home tab. (The old fromReader-only check left the Folder→Settings push stuck,
  // since navigate("Home") can't resolve the tab from the root stack.)
  const handleBackPress = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
    return true;
  }, [navigation]);
  useBackHandler(handleBackPress);
  const isDatabaseUpdateAvailable = useSelector((state) => state.isDatabaseUpdateAvailable);

  const { navigate } = navigation;
  const { c, layout } = useTokens();
  const { scrollViewProps, Indicator } = useCustomScrollbar();
  const {
    onContentSizeChange,
    onLayout,
    onScroll,
    scrollEventThrottle,
    showsVerticalScrollIndicator,
  } = scrollViewProps;

  const { DISPLAY_OPTIONS, BANI_OPTIONS, OTHER_OPTIONS, AUDIO, about, databaseUpdate } = STRINGS;
  const language = useSelector((state) => state.language);

  return (
    <SafeArea backgroundColor={c.backgroundAlt} edges={["left", "right"]}>
      <StatusBarComponent backgroundColor={c.backgroundAlt} />
      <ScreenHeader
        title={STRINGS.SETTINGS}
        onBack={handleBackPress}
        backAccessibilityLabel={STRINGS.GO_BACK}
        showBorder={false}
      />
      <GradientDivider />
      {isDatabaseUpdateAvailable && <DatabaseUpdateBanner navigate={navigate} />}
      <View style={{ flex: 1, backgroundColor: c.backgroundAlt }}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          scrollEventThrottle={scrollEventThrottle}
          onScroll={onScroll}
          onContentSizeChange={onContentSizeChange}
          onLayout={onLayout}
          contentContainerStyle={{ paddingBottom: layout.screenPaddingBottom }}
        >
          <SettingsSection title={STRINGS.ACCOUNT}>
            <Account />
          </SettingsSection>

          <SettingsSection title={DISPLAY_OPTIONS}>
            <FontSizeComponent />
            <BaniFontFaceComponent />
            <LanguageComponent language={language} />
            <TransliterationComponent />
            <TranslationComponent />
            <ThemeComponent navigate={navigate} />
            <HideStatusBar />
            <AutoScroll />
            <KeepAwake />
          </SettingsSection>

          <SettingsSection title={AUDIO}>
            <Audio />
          </SettingsSection>

          <SettingsSection title={BANI_OPTIONS}>
            <EditBaniOrder navigate={navigate} />
            <BaniLengthComponent />
            <LarivaarComponent />
            <ParagraphMode />
            <PadchedSettingsComponent />
            <VishraamComponent />
            <RemindersComponent navigation={navigation} />
          </SettingsSection>

          <SettingsSection title={OTHER_OPTIONS}>
            <CollectStatistics />
            <RevisitTutorial />
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
          </SettingsSection>
        </Animated.ScrollView>
        {Indicator}
      </View>
      {/* Reader context so Read and Music stay reachable, but NOT the reading
          theme — Settings is not the reading surface, and a themed bar under a
          standard Settings page reads as a leftover from a mode you have left. */}
      {fromReader && (
        <BottomNavigation activeKey={constant.SETTINGS} context="reader" visible themed={false} />
      )}
    </SafeArea>
  );
};

Settings.propTypes = {
  navigation: PropTypes.shape({
    canGoBack: PropTypes.func,
    goBack: PropTypes.func,
    navigate: PropTypes.func,
    setOptions: PropTypes.func,
  }).isRequired,
  route: PropTypes.shape({ params: PropTypes.shape({ fromReader: PropTypes.bool }) }),
};

export default Settings;
