import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Appearance, ActivityIndicator, BackHandler, AppState, Platform } from "react-native";
import { WebView } from "react-native-webview";
import PropTypes from "prop-types";
import {
  constant,
  colors,
  actions,
  useScreenAnalytics,
  logMessage,
  logError,
  SafeArea,
} from "@common";
import StatusBarComponent from "@common/components/StatusBar";
import { Header, AutoScrollComponent } from "./components";
import { useBookmarks, useFetchShabad } from "./hooks";
import { styles, nightColors } from "./styles";
import { loadHTML } from "./utils";

const Reader = ({ navigation, route }) => {
  logMessage(constant.READER);
  const isNightMode = useSelector((state) => state.isNightMode);
  const bookmarkPosition = useSelector((state) => state.bookmarkPosition);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
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
  const [dakeKey, setDateKey] = useState(Date.now().toString());
  const [needsReload, setNeedsReload] = useState(false);
  const lastActivityTimestamp = useRef(Date.now());

  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(id);
  const { backgroundColor, safeAreaViewBack, backViewColor } = nightColors(isNightMode);
  const { READER_STATUS_BAR_COLOR } = colors;

  // Memoize WebView key to prevent unnecessary remounts
  const webViewKey = useMemo(() => {
    return `${id}-${isParagraphMode}-${isLarivaar}-${isLarivaarAssist}-${isVishraam}-${vishraamOption}-${dakeKey}`;
  }, [id, isParagraphMode, isLarivaar, isLarivaarAssist, isVishraam, vishraamOption, dakeKey]);

  // Memoize WebView source to prevent unnecessary remounts
  const webViewSource = useMemo(() => {
    return {
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
    };
  }, [
    shabad,
    isTransliteration,
    fontSize,
    fontFace,
    isEnglishTranslation,
    isPunjabiTranslation,
    isSpanishTranslation,
    isNightMode,
    isLarivaar,
    currentPosition,
  ]);

  const updateTheme = useCallback(() => {
    const currentColorScheme = Appearance.getColorScheme();
    dispatch(actions.toggleNightMode(currentColorScheme === "dark"));
  }, [dispatch]);

  useScreenAnalytics(title);
  useBookmarks(webViewRef, shabad, bookmarkPosition);

  // Force reload WebView if it's been inactive for a while
  const checkWebViewHealth = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTimestamp.current;

    // If it's been more than 30 minutes since last activity
    if (timeSinceLastActivity > 30 * 60 * 1000) {
      setNeedsReload(true);
      lastActivityTimestamp.current = now;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    let isMounted = true;
    const subscription = AppState.addEventListener("change", (state) => {
      if (!isMounted) return;

      if (state === "active") {
        // App came to foreground
        checkWebViewHealth();

        if (needsReload) {
          // Reload WebView if needed
          setDateKey(Date.now().toString());
          setNeedsReload(false);
        }

        if (theme === constant.Default) {
          updateTheme();
        }
      } else if (state === "background") {
        // App went to background
        if (webViewRef?.current) {
          // Save position before going to background
          webViewRef.current.postMessage(JSON.stringify({ savePosition: true }));
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [theme, updateTheme, needsReload, checkWebViewHealth]);

  // Set up a timer to periodically check WebView health
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ ping: true }));
      }
      checkWebViewHealth();
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(healthCheckInterval);
  }, [checkWebViewHealth]);

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

  const handleBackPress = useCallback(() => {
    if (webViewRef?.current) {
      webViewRef.current.postMessage(JSON.stringify({ Back: true }));
      setShouldNavigateBack(true);
    }
    return true;
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
      // Update last activity timestamp
      lastActivityTimestamp.current = Date.now();

      const { data } = message.nativeEvent;

      // Handle heartbeat messages
      if (data === "heartbeat" || data === "visible" || data === "ping") {
        return;
      }

      // Handle UI toggle messages
      if (data === "toggle") {
        toggleHeader((prev) => !prev);
      } else if (data === "show") {
        toggleHeader(true);
      } else if (data === "hide") {
        toggleHeader(false);
      } else if (data.includes("save")) {
        const position = data.split("-")[1];
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
    }, 100);
  }, []);

  const handleError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    logError(`Reader web View Error ${nativeEvent}`);
    setNeedsReload(true);
  }, []);

  const handleHttpError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    logError("HTTP error status code:", nativeEvent.statusCode);
    setNeedsReload(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    lastActivityTimestamp.current = Date.now();
    setNeedsReload(false);

    // Set initial position after load
    if (currentPosition > 0 && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          setPosition: currentPosition,
        })
      );
    }
  }, [currentPosition]);

  const reloadWebView = useCallback(() => {
    if (webViewRef.current) {
      setDateKey(Date.now().toString());
    }
  }, []);

  return (
    <SafeArea backgroundColor={safeAreaViewBack.backgroundColor}>
      <StatusBarComponent backgroundColor={backgroundColor} />
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
        onLoadEnd={handleLoadEnd}
        ref={webViewRef}
        onError={handleError}
        onHttpError={handleHttpError}
        decelerationRate={0.998}
        scrollEnabled
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled
        onContentProcessDidTerminate={reloadWebView}
        source={webViewSource}
        backgroundColor={isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR}
        style={[webView, isNightMode && { opacity: viewLoaded ? 1 : 0.1 }, backViewColor]}
        onMessage={handleMessage}
      />

      {isAutoScroll && (
        <AutoScrollComponent shabadID={id} webViewRef={webViewRef} isFooter={isHeader} />
      )}
    </SafeArea>
  );
};

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default React.memo(Reader);
