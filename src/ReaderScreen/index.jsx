import React, { useState, useRef, useEffect } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { constant, colors, actions, useScreenAnalytics, errorHandler } from "@common";
import { Header, AutoScrollComponent } from "./components";
import { useBookmarks, useFetchShabad } from "./hooks";
import { styles, nightColors } from "./styles";
import { loadHTML } from "./utils";

const Reader = ({ navigation, route }) => {
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
  const [error, setError] = useState(null);
  const [isHeader, toggleHeader] = useState(false);
  const [viewLoaded, toggleViewLoaded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(savePosition[id] || 0);

  const dispatch = useDispatch();

  const { shabad, isLoading, fetchShabad } = useFetchShabad(id, setError);

  const { backgroundColor, safeAreaViewBack, backViewColor } = nightColors(isNightMode);
  const { READER_STATUS_BAR_COLOR } = colors;

  if (error) {
    errorHandler(error);
    throw error;
  }

  const updateTheme = () => {
    const currentColorScheme = Appearance.getColorScheme();
    if (theme === constant.Default) {
      dispatch(actions.toggleNightMode(currentColorScheme === "dark"));
    }
  };

  useScreenAnalytics(title);
  useBookmarks(webViewRef, shabad, bookmarkPosition);

  useEffect(() => {
    if (savePosition && id) {
      setCurrentPosition(savePosition[id]);
      if (Number(savePosition[id]) > 0.9) {
        setCurrentPosition(0);
      }
    }
  }, [savePosition, id]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        updateTheme();
        fetchShabad();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchShabad]);

  const handleBackPress = () => {
    if (webViewRef) {
      webViewRef.current.postMessage(JSON.stringify({ Back: true }));
      // set Timeout to delay back function so that it will save the current position
      setTimeout(() => {
        navigation.goBack();
      }, 100);
    }
  };

  const backAction = () => {
    handleBackPress();
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove(); // Clean up
  }, []);

  const handleBookmarkPress = () => navigation.navigate(constant.BOOKMARKS, { id });
  const handleSettingsPress = () => navigation.navigate(constant.SETTINGS);

  const handleMessage = (message) => {
    const env = message.nativeEvent.data;
    if (env === "toggle") {
      // If the event is "toggle", toggle the current state of isHeader
      toggleHeader((prev) => !prev);
    } else if (env === "show") {
      // If the event is "show", set isHeader to true
      toggleHeader(true);
    } else if (env === "hide") {
      // If the event is "hide", set isHeader to false
      toggleHeader(false);
    } else if (env.includes("save")) {
      // Handle save event, where event is expected to be "save-<position>"
      const position = env.split("-")[1];
      setCurrentPosition(position);
      dispatch(actions.setPosition(position, id));
    }
  };

  return (
    <SafeAreaView style={[{ flex: 1 }, safeAreaViewBack]}>
      <StatusBar
        hidden={isStatusBar}
        backgroundColor={backgroundColor}
        barStyle={isNightMode ? "light-content" : "dark-content"}
      />

      <Header
        navigation={navigation}
        title={title}
        handleBackPress={backAction}
        handleBookmarkPress={handleBookmarkPress}
        handleSettingsPress={handleSettingsPress}
        isHeader={isHeader}
      />
      {isLoading && <ActivityIndicator size="small" color={READER_STATUS_BAR_COLOR} />}
      <WebView
        key={`${id}-${JSON.stringify({
          isParagraphMode,
          isLarivaar,
          isLarivaarAssist,
          isVishraam,
          vishraamOption,
          shabad,
        })}`}
        webviewDebuggingEnabled
        javaScriptEnabled
        originWhitelist={["*"]}
        onLoadStart={() => {
          setTimeout(() => {
            toggleViewLoaded(true);
          }, 500);
        }}
        ref={webViewRef}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setError(`Reader web View Error ${nativeEvent}`);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setError("HTTP error status code:", nativeEvent.statusCode);
        }}
        decelerationRate="normal"
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
        onMessage={(message) => handleMessage(message)}
      />

      {isAutoScroll && <AutoScrollComponent shabadID={id} ref={webViewRef} isFooter={isHeader} />}
    </SafeAreaView>
  );
};

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default Reader;
