import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { StatusBar, ActivityIndicator, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import PropTypes from "prop-types";
import { SafeAreaView } from "react-native-safe-area-context";
import { constant, colors, actions, useScreenAnalytics, errorHandler } from "@common";
import { Header, AutoScrollComponent } from "./components";
import { useBookmarks, useFetchShabad } from "./hooks";
import { styles, nightColors } from "./styles";
import { loadHTML } from "./utils";

const Reader = ({ navigation, route }) => {
  const webViewRef = useRef(null);
  const headerRef = useRef(null);
  const { webView } = styles;
  const { title, id } = route.params.params;
  const [error, setError] = useState(null);
  const [isHeader, toggleIsHeader] = useState(true);
  const [viewLoaded, toggleViewLoaded] = useState(false);
  const [shabadID, setShabadID] = useState(Number(id));

  const dispatch = useDispatch();

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
  const isHeaderFooter = useSelector((state) => state.isHeaderFooter);

  const { shabad, isLoading } = useFetchShabad(shabadID, setError);
  const [currentPosition, setCurrentPosition] = useState(savePosition[shabadID] || 0);
  const { backgroundColor, safeAreaViewBack, backViewColor } = nightColors(isNightMode);
  const { READER_STATUS_BAR_COLOR } = colors;
  if (error) {
    errorHandler(error);
    throw error;
  }
  useScreenAnalytics(title);
  useBookmarks(webViewRef, shabad, bookmarkPosition);

  useEffect(() => {
    setShabadID(Number(id));
  }, [id]);

  useEffect(() => {
    setCurrentPosition(savePosition[shabadID]);
    if (Number(savePosition[shabadID]) > 0.9) {
      setCurrentPosition(0);
    }
  }, []);
  useEffect(() => {
    if (headerRef.current && headerRef.current.toggle) {
      headerRef.current.toggle(isHeader);
    }
  }, [isHeader]);

  const handleBackPress = () => {
    webViewRef.current.postMessage(JSON.stringify({ Back: true }));
    setTimeout(() => {
      navigation.goBack();
    }, 100);
  };
  const backAction = () => {
    handleBackPress();
    return true; // Return `true` to prevent default behavior
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove(); // Clean up
  }, []);

  const handleBookmarkPress = () => navigation.navigate(constant.BOOKMARKS, { id: shabadID });
  const handleSettingsPress = () => navigation.navigate(constant.SETTINGS);

  const handleMessage = (message) => {
    const env = message.nativeEvent.data;
    if (env === "toggle") {
      // If the event is "toggle", toggle the current state of isHeader
      toggleIsHeader((prev) => !prev);
      dispatch(actions.toggleHeaderFooter(!isHeaderFooter));
    } else if (env === "show") {
      // If the event is "show", set isHeader to true
      toggleIsHeader(true);
      dispatch(actions.toggleHeaderFooter(true));
    } else if (env === "hide") {
      // If the event is "hide", set isHeader to false
      toggleIsHeader(false);
      dispatch(actions.toggleHeaderFooter(false));
    } else if (env.includes("save")) {
      // Handle save event, where event is expected to be "save-<position>"
      const position = env.split("-")[1];
      setCurrentPosition(position);
      dispatch(actions.setPosition(position, shabadID));
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
        ref={headerRef}
        navigation={navigation}
        title={title}
        handleBackPress={backAction}
        handleBookmarkPress={handleBookmarkPress}
        handleSettingsPress={handleSettingsPress}
      />
      {isLoading && <ActivityIndicator size="small" color={READER_STATUS_BAR_COLOR} />}
      <WebView
        key={`${shabadID}-${JSON.stringify({
          isParagraphMode,
          isLarivaar,
          isLarivaarAssist,
          isVishraam,
          vishraamOption,
          shabad,
        })}`}
        originWhitelist={["*"]}
        onLoadStart={() => {
          setTimeout(() => {
            toggleViewLoaded(true);
          }, 500);
        }}
        ref={webViewRef}
        decelerationRate="normal"
        source={{
          html: loadHTML(
            shabadID,
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
          baseUrl: "",
        }}
        style={[webView, isNightMode && { opacity: viewLoaded ? 1 : 0.1 }, backViewColor]}
        onMessage={(message) => handleMessage(message)}
      />

      {isAutoScroll && <AutoScrollComponent shabadID={shabadID} ref={webViewRef} />}
    </SafeAreaView>
  );
};

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default Reader;
