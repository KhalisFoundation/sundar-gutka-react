import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState, useRef } from "react";
import { FlatList, View, StatusBar, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Icon } from "@rneui/themed";
import { getShabadFromID } from "../database/db";
import colors from "../common/colors";
import constant from "../common/constant";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { fontSizeForReader, fontColorForReader } from "./utils/util";
import { setBookmarkPosition } from "../common/actions";
const { height, width } = Dimensions.get("window");

function Reader({ navigation, route }) {
  const readerRef = useRef();

  const {
    baniLength,
    transliterationLanguage,
    isNightMode,
    fontFace,
    fontSize,
    larivaar,
    isEnglishTranslation,
    isPunjabiTranslation,
    isSpanishTranslation,
    isTransliteration,
    bookmarkPosition,
  } = useSelector((state) => state);
  const [shabadID, setShabadID] = useState(Number(route.params.params.id));
  const [rowHeights, setRowHeights] = useState([]);
  const [shabad, setShabad] = useState([]);
  const [page, setPage] = useState([]);
  const [endReached, setEndReached] = useState(false);
  const [bookmarkIndex, setBookmarkIndex] = useState(0);
  const [maxPageLength, setMaxPageLength] = useState(50);
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      try {
        setShabadID(Number(route.params.params.id));
        const data = await getShabadFromID(shabadID, baniLength, transliterationLanguage);
        setShabad(data);
        pagination(data);
      } catch (error) {
        console.log("Error eh wala ", error);
      }
    })();
  }, [shabadID, transliterationLanguage, bookmarkPosition]);

  useEffect(() => {
    navigation.setOptions({
      title: route.params.params.title,
      headerTitleStyle: {
        color: colors.WHITE_COLOR,
        fontWeight: "normal",
        fontFamily: constant.GURBANI_AKHAR_TRUE,
        fontSize: 20,
      },
      headerStyle: {
        backgroundColor: !isNightMode
          ? colors.READER_STATUS_BAR_COLOR
          : colors.READER_STATUS_BAR_COLOR_NIGHT_MODE,
      },
      headerLeft: () => (
        <Icon
          name="arrow-back"
          size={30}
          onPress={() => navigation.goBack()}
          color={colors.WHITE_COLOR}
        />
      ),
      headerRight: () => {
        return (
          <>
            <Icon
              name="bookmark"
              color={colors.TOOLBAR_TINT}
              size={30}
              onPress={() => {
                // this.trackScreenForShabad(params);
                navigation.navigate("Bookmarks", { id: shabadID });
              }}
            />
            <Icon
              name="settings"
              color={colors.TOOLBAR_TINT}
              size={30}
              onPress={() => {
                navigation.navigate(constant.SETTINGS);
              }}
            />
          </>
        );
      },
    });
  }, []);

  const pagination = (data) => {
    setPage(data.slice(0, maxPageLength));
  };
  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;

    const isEndReached = scrollPosition + scrollViewHeight >= contentHeight - maxPageLength;
    if (isEndReached && !endReached) {
      setEndReached(true);
    }
  };

  useEffect(() => {
    if (endReached) {
      const nextPageItems = shabad.slice(page.length, page.length + maxPageLength);
      setPage((prevItems) => [...prevItems, ...nextPageItems]);
      setEndReached(false);
    }
  }, [endReached]);

  useEffect(() => {
    if (bookmarkPosition !== 0) {
      console.log("bookmarkPosition", bookmarkPosition);
      const index = shabad.findIndex((item) => item.id === bookmarkPosition);
      console.log("bookmarkIndex", index);
      setBookmarkIndex(index);
      dispatch(setBookmarkPosition(0));
      if (page.length < index && maxPageLength < index) {
        setMaxPageLength(index + 10);
        pagination(shabad);
      }
    }
  }, [bookmarkPosition, page]);
  useEffect(() => {
    if (bookmarkIndex > 0 && rowHeights.length >= bookmarkIndex) {
      console.log("it's running");
      const position = rowHeights.slice(0, bookmarkIndex).reduce((a, b) => a + b, 0);
      readerRef.current?.scrollTo({ y: position, animated: true });
    }
  }, [bookmarkPosition, rowHeights]);

  const renderItem = (item, index) => {
    const tuk = item;
    let textAlign = "left";
    switch (tuk.header) {
      case 0:
        textAlign = "left";
        break;
      case 1:
        textAlign = "center";
        break;
      case 2:
        textAlign = "center";
        break;
      default:
        textAlign = "right";
        break;
    }
    const styles = StyleSheet.create({
      gurmukhiText: {
        color: fontColorForReader(tuk.header, isNightMode, constant.GURMUKHI),
        fontFamily: fontFace,
        fontSize: fontSizeForReader(fontSize, tuk.header, false, larivaar),
        textAlign,
        margin: 5,
      },
      translit: {
        fontFamily: constant.Arial,
        padding: 0.2,
        fontSize: fontSizeForReader(fontSize, tuk.header, true),
        color: fontColorForReader(tuk.header, isNightMode, constant.TRANSLITERATION),
        textAlign,
        fontWeight: tuk.header === 0 ? "normal" : "bold",
      },
      englishTranslations: {
        padding: 0.2,
        fontFamily: constant.Arial,
        fontSize: fontSizeForReader(fontSize, tuk.header, true),
        color: fontColorForReader(tuk.header, isNightMode, constant.TRANSLATION),
        textAlign,
        fontWeight: tuk.header === 0 ? "normal" : "bold",
      },
      spanishTranslations: {
        padding: 0.2,
        fontFamily: constant.Arial,
        fontSize: fontSizeForReader(fontSize, tuk.header, true),
        color: fontColorForReader(tuk.header, isNightMode, constant.TRANSLATION),
        textAlign,
        fontWeight: tuk.header === 0 ? "normal" : "bold",
      },
      punjabiTranslations: {
        padding: 0.2,
        fontFamily: fontFace,
        fontSize: fontSizeForReader(fontSize, tuk.header, true),
        color: fontColorForReader(tuk.header, isNightMode, constant.TRANSLATION),
        textAlign,
        fontWeight: tuk.header === 0 ? "normal" : "bold",
      },
      container: {
        backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR,
        padding: 10,
      },
      vishraamGradient: {
        borderRadius: 5,
      },
      vishramBasic: {
        // color: VISHRAM_BASIC,
      },
      // VISHRAM_SHORT: { color: VISHRAM_SHORT },
      paragraphStyle: { flex: 1, flexDirection: "row" },
    });
    return (
      <View
        key={index}
        onLayout={({ nativeEvent }) => {
          const newRowHeights = [...rowHeights];
          newRowHeights[index] = nativeEvent.layout.height;
          setRowHeights(newRowHeights);
        }}
      >
        <Text style={styles.gurmukhiText}>{tuk.gurmukhi}</Text>
        {isTransliteration && <Text style={styles.translit}>{tuk.translit}</Text>}
        {isEnglishTranslation && (
          <Text style={styles.englishTranslations}>{tuk.englishTranslations}</Text>
        )}
        {isPunjabiTranslation && (
          <Text style={styles.punjabiTranslations}>{tuk.punjabiTranslations}</Text>
        )}
        {isSpanishTranslation && (
          <Text style={styles.spanishTranslations}>{tuk.spanishTranslations}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaProvider
      style={{ backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar
          backgroundColor={
            isNightMode ? colors.READER_STATUS_BAR_COLOR_NIGHT_MODE : colors.READER_STATUS_BAR_COLOR
          }
          barStyle={isNightMode ? "light-content" : "dark-content"}
        />

        <ScrollView
          ref={readerRef}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={4000}
        >
          {page.map((item, index) => renderItem(item, index))}
        </ScrollView>
        {/* <FlatList
          ref={readerRef}
          style={{ margin: 5 }}
          data={shabad}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              readerRef.current?.scrollToIndex({ index: info.index, animated: true });
            });
          }}
        /> */}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default Reader;
