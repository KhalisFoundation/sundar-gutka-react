import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ActivityIndicator, AppState, Platform, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  constant,
  actions,
  logError,
  SafeArea,
  BottomNavigation,
  useTheme,
  useThemedStyles,
  StatusBarComponent,
  useBackHandler,
} from "@common";
import { Header, AutoScrollComponent, AudioPlayer } from "./components";
import { useBookmarks, useFetchShabad, useFooterAnimation } from "./hooks";
import createStyles from "./styles";
import { loadHTML } from "./utils";

const Reader = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
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

  const webViewRef = useRef(null);
  const { webView } = styles;
  const { title, id, titleUni } = route.params.params || {};
  const [isHeader, toggleHeader] = useState(false);
  const [viewLoaded, toggleViewLoaded] = useState(false);
  const [currentElementId, setCurrentElementId] = useState(savePosition[id] || null);
  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);
  const [dateKey, setDateKey] = useState(Date.now().toString());
  const [titleText, setTitleText] = useState(null);
  const currentElementIdRef = useRef(null);

  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(id);
  const { bottom: insetBottom } = useSafeAreaInsets();

  const { animationPosition } = useFooterAnimation(isHeader);

  // Save element ID when leaving screen or app goes to background
  const saveScrollPosition = useCallback(() => {
    // Prefer element ID if available, otherwise fall back to currentElementId state
    const elementIdToSave = currentElementIdRef.current || currentElementId;
    if (elementIdToSave) {
      dispatch(actions.setPosition(elementIdToSave, id));
    }
  }, [dispatch, id, currentElementId]);

  useEffect(() => {
    dispatch(actions.setCurrentBani({ id, title, titleUni }));
  }, [id, title, titleUni]);

  useEffect(() => {
    // Handle undefined titleUni gracefully - fallback to title if titleUni is not available
    const displayTitle = fontFace === constant.BALOO_PAAJI ? titleUni || title : title;
    setTitleText(displayTitle);
  }, [fontFace, titleUni, title]);

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
        isLarivaar
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
  ]);

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

  // Set currentElementId from savePosition when it changes
  useEffect(() => {
    if (savePosition && id && savePosition[id]) {
      const savedElementId = savePosition[id];
      // Check if it's a number (old position format) or string (element ID)
      if (typeof savedElementId === "string") {
        setCurrentElementId(savedElementId);
        currentElementIdRef.current = savedElementId;
      } else if (typeof savedElementId === "number" && savedElementId > 0.9) {
        // Old position format - reset to null if at end
        setCurrentElementId(null);
        currentElementIdRef.current = null;
      }
    }
  }, [savePosition, id]);

  const handleBackPress = useCallback(() => {
    // Save position before navigating back
    saveScrollPosition();
    if (webViewRef?.current) {
      navigation.goBack();
    }
    return true;
  }, [saveScrollPosition]);

  useBackHandler(handleBackPress);

  const handleBookmarkPress = useCallback(() => {
    navigation.navigate(constant.BOOKMARKS, { id });
  }, [navigation, id]);

  const handleMessage = useCallback(
    (message) => {
      // Update last activity timestamp
      const { data } = message.nativeEvent;
      // Handle UI messages (removed toggle since it's handled by onTouchStart)
      if (data === "show") {
        toggleHeader(true);
      } else if (data === "hide") {
        toggleHeader(false);
      } else if (data.includes("scroll-elementId-")) {
        // Capture element ID from WebView scroll events
        const elementId = data.split("scroll-elementId-")[1];
        setCurrentElementId(elementId);
        currentElementIdRef.current = elementId;
        // Save immediately when element ID changes
        dispatch(actions.setPosition(elementId, id));
        if (shouldNavigateBack) {
          navigation.goBack();
          setShouldNavigateBack(false);
        }
      } else if (data.includes("reached-end")) {
        // User reached the end - reset saved position
        setCurrentElementId(null);
        currentElementIdRef.current = null;
        dispatch(actions.setPosition(0, id));
      } else if (data.includes("sequenceString-")) {
        const sequenceStringData = data.split("-")[1];
        dispatch(actions.setBookmarkSequenceString(sequenceStringData));
      }
    },
    [dispatch, id, navigation, shouldNavigateBack]
  );

  const handleLoadStart = useCallback(() => {
    setTimeout(() => {
      toggleViewLoaded(true);
    }, 100);
  }, []);

  const handleLoadEnd = useCallback(() => {
    // Scroll to saved element ID after WebView is fully loaded
    if (webViewRef.current && currentElementId) {
      const scrollMessage = {
        action: "scrollToPosition",
        elementId: currentElementId,
      };
      webViewRef.current.postMessage(JSON.stringify(scrollMessage));
    }
  }, [currentElementId]);

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

  return (
    <SafeArea backgroundColor={theme.colors.surface} edges={["left", "right"]}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      <Header
        title={titleText}
        handleBackPress={handleBackPress}
        handleBookmarkPress={handleBookmarkPress}
        isHeader={isHeader}
      />
      {isLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
      <WebView
        key={webViewKey}
        webviewDebuggingEnabled
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
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
        backgroundColor={theme.colors.surface}
        style={[
          webView,
          theme.mode === "dark" && { opacity: viewLoaded ? 1 : 0.1 },
          { backgroundColor: theme.colors.surface, marginTop: 60 },
        ]}
        onMessage={handleMessage}
        onTouchStart={() => {
          // Toggle header when WebView is touched (not overlaid elements)
          toggleHeader((prev) => !prev);
        }}
      />
      {isAudio && <AudioPlayer baniID={id} title={titleText} webViewRef={webViewRef} />}
      <Animated.View
        style={[
          styles.autoScrollAnimatedView,
          {
            bottom: styles.autoScrollAnimatedView.bottom + insetBottom,
            transform: [{ translateY: animationPosition }],
          },
        ]}
      >
        {isAutoScroll && <AutoScrollComponent shabadID={id} webViewRef={webViewRef} />}
      </Animated.View>

      <BottomNavigation activeKey={isAudio ? "Music" : "Read"} />
    </SafeArea>
  );
};

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default React.memo(Reader);
