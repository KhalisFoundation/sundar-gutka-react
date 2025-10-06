import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ActivityIndicator, BackHandler, AppState, Platform } from "react-native";
import { WebView } from "react-native-webview";
import PropTypes from "prop-types";
import { constant, actions, useScreenAnalytics, logMessage, logError, SafeArea } from "@common";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import StatusBarComponent from "@common/components/StatusBar";
import { HomeIcon, BookmarkIcon, SettingsIcon } from "@common/icons";
import BottomNavigation from "./components/BottomNavigation";
import { Header, AutoScrollComponent } from "./components";
import { useBookmarks, useFetchShabad } from "./hooks";
import createStyles from "./styles";
import { loadHTML } from "./utils";

const Reader = ({ navigation, route }) => {
  logMessage(constant.READER);
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
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

  const webViewRef = useRef(null);
  const { webView } = styles;
  const { title, id, titleUni } = route.params.params;
  const [isHeader, toggleHeader] = useState(true);
  const [viewLoaded, toggleViewLoaded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(savePosition[id] || 0);
  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);
  const [dateKey, setDateKey] = useState(Date.now().toString());
  const positionPointer = useRef(0);

  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(id);

  // Save scroll position when leaving screen or app goes to background
  const saveScrollPosition = useCallback(() => {
    if (positionPointer.current > 0) {
      dispatch(actions.setPosition(parseFloat(positionPointer.current), id));
    }
  }, [dispatch, id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Save position when component unmounts
      saveScrollPosition();
    };
  }, [saveScrollPosition]);

  // Memoize WebView key to prevent unnecessary remounts
  const webViewKey = useMemo(() => {
    return `${id}-${isParagraphMode}-${isLarivaar}-${isLarivaarAssist}-${isVishraam}-${vishraamOption}-${dateKey}`;
  }, [id, isParagraphMode, isLarivaar, isLarivaarAssist, isVishraam, vishraamOption, dateKey]);

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
        theme,
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
    theme,
    isLarivaar,
    currentPosition,
  ]);

  useScreenAnalytics(title);
  useBookmarks(webViewRef, shabad, bookmarkPosition);

  // Handle app state changes
  useEffect(() => {
    let isMounted = true;
    const subscription = AppState.addEventListener("change", (state) => {
      if (!isMounted) return;

      if (state === "active") {
        // App came to foreground
      } else if (state === "background") {
        // App went to background - save scroll position
        saveScrollPosition();
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [saveScrollPosition]);

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
      const { data } = message.nativeEvent;
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
      } else if (data.includes("scroll-")) {
        const position = data.split("-")[1];
        positionPointer.current = position;
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
  }, []);

  const handleHttpError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    logError("HTTP error status code:", nativeEvent.statusCode);
  }, []);

  const reloadWebView = useCallback(() => {
    if (webViewRef.current) {
      setDateKey(Date.now().toString());
    }
  }, []);

  const navigationItems = [
    { key: "Home", icon: HomeIcon, handlePress: () => navigation.navigate("Home") },
    {
      key: "Bookmarks",
      icon: BookmarkIcon,
      handlePress: () => handleBookmarkPress(),
    },
    {
      key: "Settings",
      icon: SettingsIcon,
      handlePress: () => handleSettingsPress(),
    },
  ];

  return (
    <SafeArea backgroundColor={theme.colors.surface}>
      <StatusBarComponent backgroundColor={theme.colors.primary} />
      <Header
        title={fontFace === constant.BALOO_PAAJI ? titleUni : title}
        handleBackPress={handleBackPress}
        isHeader={isHeader}
      />
      {isLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
      <WebView
        key={webViewKey}
        webviewDebuggingEnabled
        javaScriptEnabled
        originWhitelist={["*"]}
        onLoadStart={handleLoadStart}
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
        backgroundColor={theme.colors.surface}
        style={[
          webView,
          theme.mode === "dark" && { opacity: viewLoaded ? 1 : 0.1 },
          { backgroundColor: theme.colors.surface },
        ]}
        onMessage={handleMessage}
      />

      {isAutoScroll && (
        <AutoScrollComponent shabadID={id} webViewRef={webViewRef} isFooter={isHeader} />
      )}
      <BottomNavigation currentRoute="Reader" navigationItems={navigationItems} />
    </SafeArea>
  );
};

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default React.memo(Reader);
