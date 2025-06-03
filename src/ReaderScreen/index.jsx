import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Appearance,
  StatusBar,
  ActivityIndicator,
  BackHandler,
  AppState,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import PropTypes from "prop-types";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { constant, colors, actions, useScreenAnalytics, logMessage, logError } from "@common";
import { Header, AutoScrollComponent } from "./components";
import { useBookmarks, useFetchShabad } from "./hooks";
import { styles, nightColors } from "./styles";
import { loadHTML } from "./utils";

const Reader = ({ navigation, route }) => {
  logMessage(constant.READER);
  const isNightMode = useSelector((state) => state.isNightMode);
  const bookmarkPosition = useSelector((state) => state.bookmarkPosition);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const fontSize = useSelector((state) => state.fontSize);
  const fontFace = useSelector((state) => state.fontFace);
  const isLarivaar = useSelector((state) => state.isLarivaar);
  const isLarivaarAssist = useSelector((state) => state.isLarivaarAssist);
  const isEnglishTranslation = useSelector((state) => state.isEnglishTranslation);
  const isPunjabiTranslation = useSelector((state) => state.isPunjabiTranslation);
  const isSpanishTranslation = useSelector((state) => state.isSpanishTranslation);
  const isParagraphMode = useSelector((state) => state.isParagraphMode);
  const isVishraam = useSelector((state) => state.isVishraam);
  const vishraamOption = useSelector((state) => state.vishraamOption);
  const savePosition = useSelector((state) => state.savePosition);
  const theme = useSelector((state) => state.theme);

  const webViewRef = useRef(null);
  const { webView } = styles;
  const { title, id } = route.params.params;
  const [isHeader, toggleHeader] = useState(false);
  const [viewLoaded, toggleViewLoaded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(savePosition[id] || 0);
  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);

  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(id);
  const { backgroundColor, safeAreaViewBack, backViewColor } = nightColors(isNightMode);
  const { READER_STATUS_BAR_COLOR } = colors;

  // Memoize WebView key to prevent unnecessary remounts
  const webViewKey = useMemo(() => {
    return `${id}-${isParagraphMode}-${isLarivaar}-${isLarivaarAssist}-${isVishraam}-${vishraamOption}`;
  }, [id, isParagraphMode, isLarivaar, isLarivaarAssist, isVishraam, vishraamOption]);

  const updateTheme = useCallback(() => {
    const currentColorScheme = Appearance.getColorScheme();
    dispatch(actions.toggleNightMode(currentColorScheme === "dark"));
  }, [dispatch]);

  useScreenAnalytics(title);
  useBookmarks(webViewRef, shabad, bookmarkPosition);

  useEffect(() => {
    if (savePosition && id) {
      const position = savePosition[id];
      if (position > 0.9) {
        setCurrentPosition(0);
      } else {
        setCurrentPosition(position);
      }
    }
  }, [savePosition, id]);

  useEffect(() => {
    let isMounted = true;
    const subscription = AppState.addEventListener("change", (state) => {
      if (!isMounted) return;

      if (webViewRef?.current) {
        webViewRef.current.postMessage(JSON.stringify({ Back: true }));
      }

      if (state === "active") {
        if (theme === constant.Default) {
          updateTheme();
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [theme, updateTheme]);

  const handleBackPress = useCallback(() => {
    if (webViewRef?.current) {
      webViewRef.current.postMessage(JSON.stringify({ Back: true }));
      setShouldNavigateBack(true);
    }
    return true;
    // webViewRef is a ref object and is stable across renders, so it does not need to be included in the dependency array.
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);

  const handleBookmarkPress = useCallback(() => {
    navigation.navigate(constant.BOOKMARKS, { id });
  }, [navigation, id]);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate(constant.SETTINGS);
  }, [navigation]);

  const handleMessage = useCallback(
    (message) => {
      const env = message.nativeEvent.data;
      if (env === "toggle") {
        toggleHeader((prev) => !prev);
      } else if (env === "show") {
        toggleHeader(true);
      } else if (env === "hide") {
        toggleHeader(false);
      } else if (env.includes("save")) {
        const position = env.split("-")[1];
        setCurrentPosition(position);
        dispatch(actions.setPosition(position, id));
        if (shouldNavigateBack) {
          navigation.goBack();
          setShouldNavigateBack(false);
        }
      }
    },
    [dispatch, id, navigation, shouldNavigateBack]
  );

  const handleLoadStart = useCallback(() => {
    setTimeout(() => {
      toggleViewLoaded(true);
    }, 500);
  }, []);

  const handleError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    logError(`Reader web View Error ${nativeEvent}`);
  }, []);

  const handleHttpError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    logError("HTTP error status code:", nativeEvent.statusCode);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[{ flex: 1 }, safeAreaViewBack]}>
        <StatusBar
          hidden={isStatusBar}
          backgroundColor={backgroundColor}
          barStyle={isNightMode ? "light-content" : "dark-content"}
        />

        <Header
          navigation={navigation}
          title={title}
          handleBackPress={handleBackPress}
          handleBookmarkPress={handleBookmarkPress}
          handleSettingsPress={handleSettingsPress}
          isHeader={isHeader}
        />
        {isLoading && <ActivityIndicator size="small" color={READER_STATUS_BAR_COLOR} />}
        <WebView
          key={webViewKey}
          webviewDebuggingEnabled
          javaScriptEnabled
          originWhitelist={["*"]}
          onLoadStart={handleLoadStart}
          ref={webViewRef}
          onError={handleError}
          onHttpError={handleHttpError}
          decelerationRate="normal"
          scrollEnabled
          bounces={false}
          overScrollMode="never"
          nestedScrollEnabled
          source={{
            html: loadHTML(
              shabad,
              isTransliteration,
              fontSize,
              fontFace,
              isEnglishTranslation,
              isPunjabiTranslation,
              isSpanishTranslation,
              isNightMode,
              isLarivaar,
              currentPosition
            ),
            baseUrl: Platform.OS === "ios" ? "./" : "",
          }}
          style={[webView, isNightMode && { opacity: viewLoaded ? 1 : 0.1 }, backViewColor]}
          onMessage={handleMessage}
        />

        {isAutoScroll && (
          <AutoScrollComponent shabadID={id} webViewRef={webViewRef} isFooter={isHeader} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default React.memo(Reader);
