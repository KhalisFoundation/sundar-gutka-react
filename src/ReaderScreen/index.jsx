import React, { useState, useRef, useEffect } from "react";
import {
  StatusBar,
  ActivityIndicator,
  BackHandler,
  Text,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { SafeAreaView } from "react-native-safe-area-context";
import { constant, colors, actions, useScreenAnalytics } from "@common";
import { useBookmarks, useFetchShabad } from "./hooks";
import { styles, nightColors } from "./styles";
import Header from "./components/header";

const Reader = ({ navigation, route }) => {
  const scrollViewRef = useRef(null);
  const headerRef = useRef(null);
  const elementPositions = useRef({});
  const { title, id } = route.params.params;
  const [isHeader, toggleIsHeader] = useState(true);
  const [shabadID, setShabadID] = useState(Number(route.params.params.id));
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const scrollYAnimatedValue = useRef(new Animated.Value(0)).current;
  const autoScrollTimer = useRef(null);

  const dispatch = useDispatch();

  // Redux selectors
  const isNightMode = useSelector((state) => state.isNightMode);
  const isLarivaar = useSelector((state) => state.isLarivaar);
  const isLarivaarAssist = useSelector((state) => state.isLarivaarAssist);
  const bookmarkPosition = useSelector((state) => state.bookmarkPosition);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const fontFace = useSelector((state) => state.fontFace);
  const fontSize = useSelector((state) => state.fontSize);
  const fontSizes = { EXTRA_SMALL: 14, SMALL: 16, MEDIUM: 20, LARGE: 24, EXTRA_LARGE: 30 };
  const isEnglishTranslation = useSelector((state) => state.isEnglishTranslation);
  const isPunjabiTranslation = useSelector((state) => state.isPunjabiTranslation);
  const isSpanishTranslation = useSelector((state) => state.isSpanishTranslation);
  const isParagraphMode = useSelector((state) => state.isParagraphMode);
  const savePosition = useSelector((state) => state.savePosition);
  const isHeaderFooter = useSelector((state) => state.isHeaderFooter);

  const { shabad, isLoading, groupedByParagraph } = useFetchShabad(shabadID);
  const [currentPosition, setCurrentPosition] = useState(savePosition[shabadID] || 0);
  const { backgroundColor, safeAreaViewBack } = nightColors(isNightMode);
  const { READER_STATUS_BAR_COLOR } = colors;

  useScreenAnalytics(title);
  useBookmarks(scrollViewRef, shabad, bookmarkPosition, elementPositions);

  useEffect(() => {
    setShabadID(Number(id));
  }, [id]);

  useEffect(() => {
    setCurrentPosition(savePosition[shabadID]);
    if (Number(savePosition[shabadID]) > 0.9) {
      setCurrentPosition(0);
    }
  }, [savePosition, shabadID]);

  useEffect(() => {
    if (headerRef.current && headerRef.current.toggle) {
      headerRef.current.toggle(isHeader);
    }
  }, [isHeader]);

  useEffect(() => {
    if (scrollViewRef.current && currentPosition) {
      scrollViewRef.current.scrollTo({ y: Number(currentPosition), animated: false });
    }
  }, [currentPosition]);

  const handleBackPress = () => {
    dispatch(actions.setPosition(scrollY, shabadID));
    setTimeout(() => {
      navigation.goBack();
    }, 100);
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);

  const handleBookmarkPress = () => navigation.navigate(constant.BOOKMARKS, { id: shabadID });
  const handleSettingsPress = () => navigation.navigate(constant.SETTINGS);

  const handleScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    setScrollY(currentOffset);
    dispatch(actions.setPosition(currentOffset, shabadID));
  };

  const handleTouchEnd = () => {
    toggleIsHeader((prev) => !prev);
    dispatch(actions.toggleHeaderFooter(!isHeaderFooter));
  };

  const onContentSizeChange = (contentWidth, contentHeight) => {
    setContentHeight(contentHeight);
  };

  const autoScroll = () => {
    const scrollSpeed = 50; // Adjust scroll speed as needed
    autoScrollTimer.current = setInterval(() => {
      scrollViewRef.current.scrollTo({
        y: scrollY + 1,
        animated: false,
      });
      setScrollY((prev) => prev + 1);
    }, scrollSpeed);
  };

  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoScroll) {
      autoScroll();
    } else if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [isAutoScroll, contentHeight]);
  const handleLayout = (key) => (event) => {
    elementPositions.current[key] = event.nativeEvent.layout.y;
  };

  const renderGurmukhi = (gurmukhiTuk) => {
    if (isLarivaar && isLarivaarAssist) {
      // Map each word to a <Text> component with alternating background color

      return (
        <>
          {gurmukhiTuk.split(" ").map((word, index) => {
            const style = index % 2 !== 0 ? { opacity: 0.6 } : {};
            return (
              <Text key={`${word}-${index}`} style={style}>
                {word}
              </Text>
            );
          })}
        </>
      );
    }
    // Return the entire text as a single <Text> component if not splitting by word
    return gurmukhiTuk;
  };
  const renderLines = (key) => {
    return (
      <>
        {groupedByParagraph[key].map((lineObj, index) => (
          <React.Fragment key={index}>
            <Text>
              {renderGurmukhi(lineObj.gurmukhi)}
              {"\n"}
            </Text>
            {isTransliteration && <Text>{lineObj.translit}</Text>}
            {isEnglishTranslation && lineObj.englishTranslation && (
              <Text>{lineObj.englishTranslation}</Text>
            )}
            {isPunjabiTranslation && lineObj.punjabiTranslation && (
              <Text>{lineObj.punjabiTranslation}</Text>
            )}
            {isSpanishTranslation && lineObj.spanishTranslation && (
              <Text>{lineObj.spanishTranslation}</Text>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  const renderShabad = () => {
    if (!shabad || shabad.length === 0) {
      return null;
    }
    if (isParagraphMode) {
      // Combine all lines into a paragraph
      const paragraph = shabad.map((lineObj) => lineObj.line).join(" ");
      return (
        <Text
          style={[
            styles.gurmukhiText,
            { fontFamily: fontFace },
            isNightMode && styles.nightText,
            styles.dayText,
          ]}
        >
          {paragraph}
        </Text>
      );
    }
    // Render each line separately
    return Object.keys(groupedByParagraph).map((key) => {
      return (
        <Text
          onLayout={handleLayout(groupedByParagraph[key][0].id)}
          key={groupedByParagraph[key][0].id}
          style={[
            styles.gurmukhiText,
            { fontFamily: fontFace },
            isNightMode && styles.nightText,
            styles.dayText,
            {
              fontSize:
                groupedByParagraph[key][0].header === 1
                  ? fontSizes[fontSize] * 1.2
                  : fontSizes[fontSize],
              color:
                groupedByParagraph[key][0].header === 1
                  ? colors.HEADER_COLOR_1_LIGHT
                  : colors.NIGHT_BLACK,
              textAlign:
                groupedByParagraph[key][0].header === 1 || groupedByParagraph[key][0].header === 2
                  ? "center"
                  : "left",
              marginLeft: 10,
            },
          ]}
        >
          {renderLines(key)}
        </Text>
      );
    });
  };

  // PanResponder to handle user interaction
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // User starts interaction
        if (isAutoScroll && autoScrollTimer.current) {
          clearInterval(autoScrollTimer.current);
        }
      },
      onPanResponderRelease: () => {
        // User stops interaction
        if (isAutoScroll) {
          autoScroll();
        }
      },
    })
  ).current;

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
        handleBackPress={handleBackPress}
        handleBookmarkPress={handleBookmarkPress}
        handleSettingsPress={handleSettingsPress}
      />
      {isLoading && <ActivityIndicator size="small" color={READER_STATUS_BAR_COLOR} />}
      <TouchableWithoutFeedback onPress={handleTouchEnd}>
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollYAnimatedValue } } }],
            { useNativeDriver: false, listener: handleScroll }
          )}
          scrollEventThrottle={16}
          onContentSizeChange={onContentSizeChange}
          // {...panResponder.panHandlers}
          style={{ paddingTop: 50 }}
        >
          {renderShabad()}
        </Animated.ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default Reader;
