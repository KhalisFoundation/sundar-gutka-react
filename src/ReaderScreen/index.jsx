import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Appearance,
  ActivityIndicator,
  BackHandler,
  AppState,
  Platform,
  Animated,
} from "react-native";
import { WebView } from "react-native-webview";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import StatusBarComponent from "@common/components/StatusBar";
import { HomeIcon, BookmarkIcon, SettingsIcon, MusicIcon } from "@common/icons";
import {
  constant,
  colors,
  actions,
  useScreenAnalytics,
  logMessage,
  logError,
  SafeArea,
} from "@common";
import { Header, AutoScrollComponent, AudioPlayer } from "./components";
import BottomNavigation from "./components/BottomNavigation";
import { useBookmarks, useFetchShabad, useFooterAnimation } from "./hooks";
import { styles, nightColors } from "./styles";
import { loadHTML } from "./utils";

const Reader = ({ navigation, route }) => {
  logMessage(constant.READER);
  const isNightMode = useSelector((state) => state.isNightMode);
  const bookmarkPosition = useSelector((state) => state.bookmarkPosition);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
  const isAudio = useSelector((state) => state.isAudio);
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
  const { title, id, titleUni } = route.params.params;
  const [isHeader, toggleHeader] = useState(true);
  const [viewLoaded, toggleViewLoaded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(savePosition[id] || 0);
  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);
  const [dateKey, setDateKey] = useState(Date.now().toString());
  const positionPointer = useRef(0);

  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(id);
  const { backgroundColor, safeAreaViewBack, backViewColor } = nightColors(isNightMode);
  const { READER_STATUS_BAR_COLOR } = colors;

  const { animationPosition } = useFooterAnimation(isHeader);

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

  // Handle app state changes
  useEffect(() => {
    let isMounted = true;
    const subscription = AppState.addEventListener("change", (state) => {
      if (!isMounted) return;

      if (state === "active") {
        // App came to foreground
        if (theme === constant.Default) {
          updateTheme();
        }
      } else if (state === "background") {
        // App went to background - save scroll position
        saveScrollPosition();
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [theme, updateTheme, saveScrollPosition]);

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
      // Handle UI messages (removed toggle since it's handled by onTouchStart)
      if (data === "show") {
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
      key: "Music",
      icon: MusicIcon,
      handlePress: () => {
        dispatch(actions.toggleAutoScroll(false));
        dispatch(actions.toggleAudio(!isAudio));
      },
    },
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
    <SafeArea backgroundColor={safeAreaViewBack.backgroundColor} topPadding>
      <StatusBarComponent backgroundColor={backgroundColor} />
      <Header title={titleUni} handleBackPress={handleBackPress} isHeader={isHeader} />
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
        onTouchStart={() => {
          // Toggle header when WebView is touched (not overlaid elements)
          toggleHeader((prev) => !prev);
        }}
      />

      {isAudio && (
        <AudioPlayer
          baniID={id}
          title={title}
          shouldNavigateBack={shouldNavigateBack}
          webViewRef={webViewRef}
        />
      )}
      <Animated.View
        style={[{ transform: [{ translateY: animationPosition }] }]}
        pointerEvents="box-none" // Allow touches to pass through to WebView when not hitting child components
      >
        {isAutoScroll && <AutoScrollComponent shabadID={id} webViewRef={webViewRef} />}
      </Animated.View>
      <BottomNavigation navigationItems={navigationItems} />
    </SafeArea>
  );
};

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default React.memo(Reader);
