import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { StatusBar, ActivityIndicator, Platform, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import PropTypes from "prop-types";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { constant, colors, actions, useScreenAnalytics, errorHandler, FallBack } from "../common";
import { Header, AutoScrollComponent } from "./components";
import { useBookmarks, useFetchShabad } from "./hooks";
import { styles, nightColors } from "./styles";
import { fontColorForReader, htmlTemplate, script } from "./utils";

function Reader({ navigation, route }) {
  const webViewRef = useRef(null);
  const headerRef = useRef(null);
  const { webView } = styles;

  const isNightMode = useSelector((state) => state.isNightMode);
  const bookmarkPosition = useSelector((state) => state.bookmarkPosition);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const isTransliteration = useSelector((state) => state.isTransliteration);
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
  const fontSizeNumber = useSelector((state) => state.fontSizeNumber);

  const [shabadID] = useState(Number(route.params.params.id));
  const [isHeader, toggleIsHeader] = useState(true);
  const [viewLoaded, toggleViewLoaded] = useState(false);
  const { title } = route.params.params;
  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(shabadID);
  const { backgroundColor, safeAreaViewBack, backViewColor } = nightColors(isNightMode);
  const { READER_STATUS_BAR_COLOR } = colors;
  useScreenAnalytics(title);
  useBookmarks(webViewRef, shabad, bookmarkPosition);

  useEffect(() => {
    if (headerRef.current && headerRef.current.toggle) {
      headerRef.current.toggle(isHeader);
    }
  }, [isHeader]);

  useEffect(() => {
    if (webViewRef && webViewRef.current) {
      console.log("its111111 running");
      webViewRef.current.postMessage(JSON.stringify({ fontSize: fontSizeNumber }));
    }
  }, []);

  const handleBackPress = () => {
    webViewRef.current.postMessage(JSON.stringify({ Back: true }));
    setTimeout(() => {
      navigation.goBack();
    }, 100);
  };
  useEffect(() => {
    const backAction = () => {
      handleBackPress();
      return true; // Return `true` to prevent default behavior
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => backHandler.remove(); // Clean up
  }, []);

  const handleBookmarkPress = () => navigation.navigate(constant.BOOKMARKS, { id: shabadID });
  const handleSettingsPress = () => navigation.navigate(constant.SETTINGS);

  const createDiv = (content, header, type, textAlign, id, punjabiTranslation = "") => {
    const fontClass =
      type === constant.GURMUKHI.toLowerCase() || punjabiTranslation !== ""
        ? constant.GURMUKHI.toLowerCase()
        : type;
    return `
    <div id="${id}" class="content-item ${fontClass} ${textAlign}" style="font-size: ${fontSizeNumber}px; color: ${fontColorForReader(
      header,
      isNightMode,
      type.toUpperCase()
    )};">
      ${content}
    </div>
  `;
  };

  const loadHTML = () => {
    try {
      const backColor = isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR;
      const fileUri = Platform.select({
        ios: `${fontFace}.ttf`,
        android: `file:///android_asset/fonts/${fontFace}.ttf`,
      });

      const content = shabad
        .map((item) => {
          const textAlignMap = {
            0: "left",
            1: "center",
            2: "center",
          };

          let textAlign = textAlignMap[item.header];
          if (textAlign === undefined) {
            textAlign = "right";
          }
          let contentHtml = `<div id="${item.id}" class='text-item'>`;
          contentHtml += createDiv(
            item.gurmukhi,
            item.header,
            constant.GURMUKHI.toLowerCase(),
            textAlign,
            `gurmukhi-${item.id}`
          );

          if (isTransliteration) {
            contentHtml += createDiv(
              item.translit,
              item.header,
              constant.TRANSLITERATION.toLowerCase(),
              textAlign,
              `translit-${item.id}`
            );
          }

          if (isEnglishTranslation) {
            contentHtml += createDiv(
              item.englishTranslations,
              item.header,
              constant.TRANSLATION.toLowerCase(),
              textAlign,
              `english-${item.id}`
            );
          }

          if (isPunjabiTranslation) {
            contentHtml += createDiv(
              item.punjabiTranslations,
              item.header,
              constant.TRANSLATION.toLowerCase(),
              textAlign,
              `punjabi-${item.id}`,
              constant.GURMUKHI.toLowerCase()
            );
          }

          if (isSpanishTranslation) {
            contentHtml += createDiv(
              item.spanishTranslations,
              item.header,
              constant.TRANSLATION.toLowerCase(),
              textAlign,
              `spanish-${item.id}`
            );
          }

          contentHtml += `</div>`;
          return contentHtml;
        })
        .join("");
      const htmlContent = htmlTemplate(
        backColor,
        fileUri,
        fontFace,
        content,
        isNightMode,
        savePosition[shabadID]
      );
      return htmlContent;
    } catch (error) {
      errorHandler(error);
      FallBack();
    }
  };

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
      dispatch(actions.setPosition(position, shabadID));
    } else if (env.includes("fontSize")) {
      console.log("it's running");
      const size = env.split("-")[1];
      dispatch(actions.setFontSizeNumber(size));
    }
  };
  return (
    <SafeAreaProvider style={safeAreaViewBack}>
      <SafeAreaView style={[{ flex: 1 }]}>
        <StatusBar
          hidden={isStatusBar}
          backgroundColor={backgroundColor}
          barStyle={isNightMode ? "light-content" : "dark-content"}
        />

        <Header
          ref={headerRef}
          navigation={navigation}
          title={title}
          handleBackPress={handleBackPress}
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
          injectedJavaScriptBeforeContentLoaded={script(isNightMode, savePosition[shabadID])}
          onLoadStart={() => {
            setTimeout(() => {
              toggleViewLoaded(true);
            }, 500);
          }}
          ref={webViewRef}
          decelerationRate="normal"
          source={{ html: loadHTML(), baseUrl: "" }}
          style={[webView, isNightMode && { opacity: viewLoaded ? 1 : 0.1 }, backViewColor]}
          onMessage={(message) => handleMessage(message)}
        />

        {isAutoScroll && <AutoScrollComponent shabadID={shabadID} ref={webViewRef} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default Reader;
