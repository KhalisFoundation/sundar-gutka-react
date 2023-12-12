import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState, useRef } from "react";
import { StatusBar, ActivityIndicator, Platform } from "react-native";
import { WebView } from "react-native-webview";
import PropTypes from "prop-types";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { constant, colors, actions, useScreenAnalytics } from "../common";
import { Header, AutoScrollComponent } from "./components";
import { useBookmarks, useFetchShabad } from "./hooks";
import { styles, nightColors } from "./styles";
import { fontSizeForReader, fontColorForReader, htmlTemplate } from "./utils";
import errorHandler from "../common/errHandler";
import FallBack from "../common/components/FallbackComponent";
import script from "./utils/gutkaScript";

function Reader({ navigation, route }) {
  const webViewRef = useRef(null);
  const headerRef = useRef(null);
  const { webView } = styles;
  const {
    isNightMode,
    bookmarkPosition,
    isAutoScroll,
    isStatusBar,
    isTransliteration,
    fontSize,
    fontFace,
    isLarivaar,
    isLarivaarAssist,
    isEnglishTranslation,
    isPunjabiTranslation,
    isSpanishTranslation,
    isParagraphMode,
    isVishraam,
    vishraamOption,
    savePosition,
  } = useSelector((state) => state);
  const [shabadID] = useState(Number(route.params.params.id));
  const [isHeader, toggleIsHeader] = useState(true);
  const [event, setEvent] = useState("");
  const [viewLoaded, toggleViewLoaded] = useState(false);
  const { title } = route.params.params;
  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(shabadID);
  const { backgroundColor, safeAreaViewBack } = nightColors(isNightMode);
  const { READER_STATUS_BAR_COLOR } = colors;
  useScreenAnalytics(constant.READER);
  useBookmarks(webViewRef, shabad, bookmarkPosition);

  useEffect(() => {
    if (headerRef.current && headerRef.current.toggle) {
      headerRef.current.toggle(isHeader);
    }
  }, [isHeader]);

  useEffect(() => {
    if (event === "toggle") {
      setTimeout(() => {
        toggleIsHeader((current) => !current);
      }, 100);
    }
    toggleIsHeader(event === "show");
    if (event.includes("save")) {
      const position = event.split("-")[1];
      dispatch(actions.setPosition(position, shabadID));
    }
  }, [event]);

  const handleBackPress = () => {
    webViewRef.current.postMessage(JSON.stringify({ Back: true }));
    setTimeout(() => {
      navigation.goBack();
    }, 100);
  };
  const handleBookmarkPress = () => navigation.navigate(constant.BOOKMARKS, { id: shabadID });
  const handleSettingsPress = () => navigation.navigate(constant.SETTINGS);

  const createDiv = (content, header, type, textAlign, punjabiTranslation = "") => {
    const fontClass =
      type === constant.GURMUKHI.toLowerCase() || punjabiTranslation !== ""
        ? constant.GURMUKHI.toLowerCase()
        : type;
    return `
    <div class="content-item ${fontClass} ${textAlign}" style="font-size: ${fontSizeForReader(
      fontSize,
      header,
      type === constant.TRANSLITERATION.toLowerCase() ||
        type === constant.TRANSLATION.toLowerCase(),
      isLarivaar
    )}px; color: ${fontColorForReader(header, isNightMode, type.toUpperCase())};">
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
            textAlign
          );

          if (isTransliteration) {
            contentHtml += createDiv(
              item.translit,
              item.header,
              constant.TRANSLITERATION.toLowerCase(),
              textAlign
            );
          }

          if (isEnglishTranslation) {
            contentHtml += createDiv(
              item.englishTranslations,
              item.header,
              constant.TRANSLATION.toLowerCase(),
              textAlign
            );
          }

          if (isPunjabiTranslation) {
            contentHtml += createDiv(
              item.punjabiTranslations,
              item.header,
              constant.TRANSLATION.toLowerCase(),
              textAlign,
              constant.GURMUKHI.toLowerCase()
            );
          }

          if (isSpanishTranslation) {
            contentHtml += createDiv(
              item.spanishTranslations,
              item.header,
              constant.TRANSLATION.toLowerCase(),
              textAlign
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
    setEvent(env);
  };
  return (
    <SafeAreaProvider style={safeAreaViewBack}>
      <SafeAreaView style={{ flex: 1 }}>
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
          style={[webView, isNightMode && { opacity: viewLoaded ? 1 : 0.1 }]}
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
