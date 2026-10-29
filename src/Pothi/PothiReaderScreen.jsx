import React, { useEffect, useMemo } from "react";
import { Platform, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSelector } from "react-redux";
import { useReaderTheme } from "@theme/reader";
import PropTypes from "prop-types";
import WebViewUnavailable from "@common/components/WebViewUnavailable";
import useTokens from "@common/hooks/useTokens";
import { useWebViewAvailable } from "@common/webViewAvailability";
import { GradientDivider, SafeArea, StatusBarComponent, STRINGS } from "@common";
import { ScreenHeader, Spinner, Text } from "../common/components/ui";
import { loadHTML } from "../ReaderScreen/utils";
import useFetchPothi from "./hooks/useFetchPothi";

// "Open Pothi" — every bani in the pothi in one continuous scroll.
//
// It reuses the Reader's own `loadHTML`, so the page is rendered by exactly the
// pipeline that renders a single bani: the same reading theme, font size, bani
// font, vishraam, larivaar and translation toggles, with no second
// implementation to keep in step. A pothi is simply a longer row array (see
// `useFetchPothi`).
//
// Deliberately read-only — no audio, bookmarks or autoscroll. Those are
// per-bani concepts (a bookmark points at one bani's line, the player queues
// one bani's track) and would each need a meaning across a multi-bani document
// before they could be offered here.
const PothiReaderScreen = ({ navigation, route }) => {
  const { c } = useTokens();
  const { theme: readerTheme } = useReaderTheme();
  const { title, baniIds } = route.params?.params ?? {};

  const fontSize = useSelector((state) => state.fontSize);
  const baniFontFace = useSelector((state) => state.baniFontFace);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const isEnglishTranslation = useSelector((state) => state.isEnglishTranslation);
  const isPunjabiTranslation = useSelector((state) => state.isPunjabiTranslation);
  const isSpanishTranslation = useSelector((state) => state.isSpanishTranslation);
  const isLarivaar = useSelector((state) => state.isLarivaar);

  const { shabad, isLoading } = useFetchPothi(baniIds);
  // See ReaderScreen: a WebView is mounted only once Android has said it can
  // create one, and the notice takes its place when it cannot.
  const { available: webViewAvailable, recheck: recheckWebView } = useWebViewAvailable();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const readerBg = readerTheme.background.color;

  const source = useMemo(
    () => ({
      html: loadHTML(
        shabad,
        isTransliteration,
        fontSize,
        baniFontFace,
        isEnglishTranslation,
        isPunjabiTranslation,
        isSpanishTranslation,
        readerTheme,
        isLarivaar
      ),
      baseUrl: Platform.OS === "ios" ? "./" : "",
    }),
    [
      shabad,
      isTransliteration,
      fontSize,
      baniFontFace,
      isEnglishTranslation,
      isPunjabiTranslation,
      isSpanishTranslation,
      readerTheme,
      isLarivaar,
    ]
  );

  const body = () => {
    if (isLoading) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Spinner color={c.accent} />
        </View>
      );
    }
    if (shabad.length === 0) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text variant="bodySmall" color="textSecondary" align="center">
            {STRINGS.POTHI_EMPTY_CONTENTS}
          </Text>
        </View>
      );
    }
    if (webViewAvailable === false) return <WebViewUnavailable onRetry={recheckWebView} />;
    if (webViewAvailable === null) return null;
    return (
      <WebView
        javaScriptEnabled
        originWhitelist={["*"]}
        source={source}
        backgroundColor={readerBg}
        decelerationRate={0.998}
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled
        style={{ flex: 1, backgroundColor: readerBg }}
      />
    );
  };

  return (
    <SafeArea backgroundColor={readerBg} edges={["bottom", "left", "right"]}>
      <StatusBarComponent backgroundColor={readerBg} />
      <View style={{ flex: 1, backgroundColor: readerBg }}>
        <ScreenHeader
          title={title}
          // NOT `baniTitle`. That variant is the GurbaniAkhar face, which expects
          // ASCII-encoded Gurmukhi — correct for FolderScreen, whose title comes
          // from the Banis table, and wrong here. A pothi name is typed by the
          // user or localised, so under that face it rendered as nonsense.
          showBorder={false}
          onBack={() => navigation.goBack()}
          backAccessibilityLabel={STRINGS.GO_BACK}
        />
        <GradientDivider />
        {body()}
      </View>
    </SafeArea>
  );
};

PothiReaderScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    setOptions: PropTypes.func,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      params: PropTypes.shape({
        title: PropTypes.string,
        baniIds: PropTypes.arrayOf(PropTypes.number),
      }),
    }),
  }).isRequired,
};

export default PothiReaderScreen;
