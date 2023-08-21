import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, StatusBar, ScrollView, ActivityIndicator } from "react-native";
import PropTypes from "prop-types";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import colors from "../common/colors";
import constant from "../common/constant";
import { setBookmarkPosition } from "../common/actions";
import ShabadItem from "./components/shabadItem";
import AutoScrollComponent from "./components/autoScrollComponent";
import Header from "./components/header";
import { useFetchShabad, usePagination } from "./utils/hooks";
import { styles } from "./styles";

function Reader({ navigation, route }) {
  const readerRef = useRef(null);
  const headerRef = useRef(null);

  const { isNightMode, bookmarkPosition, isAutoScroll, isStatusBar } = useSelector(
    (state) => state
  );
  const [shabadID] = useState(Number(route.params.params.id));
  const [isHeader, toggleIsHeader] = useState(true);
  const [rowHeights, setRowHeights] = useState([]);
  const [itemsCount, setItemsCount] = useState(50);
  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(shabadID);
  const { currentPage, fetchScrollData } = usePagination(shabad, itemsCount);

  const handleBackPress = useCallback(() => navigation.goBack(), [navigation]);
  const handleBookmarkPress = useCallback(() => {
    navigation.navigate("Bookmarks", { id: shabadID });
  }, [navigation, shabadID]);
  const handleSettingsPress = useCallback(
    () => navigation.navigate(constant.SETTINGS),
    [navigation]
  );

  useEffect(() => {
    if (bookmarkPosition !== 0) {
      setItemsCount(bookmarkPosition + 10);
      const index = shabad.findIndex((item) => item.id === bookmarkPosition);
      if (index > 0 && rowHeights.length >= index) {
        const position = rowHeights.slice(0, index).reduce((a, b) => a + b, 0);
        readerRef.current?.scrollTo({ y: position, animated: true });
      }
      dispatch(setBookmarkPosition(0));
    }
  }, [bookmarkPosition, rowHeights, itemsCount]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;
    toggleIsHeader(scrollPosition <= 5);
    if (headerRef.current && headerRef.current.toggle) {
      headerRef.current.toggle(isHeader);
    }
    fetchScrollData(scrollPosition, scrollViewHeight, contentHeight);
  };

  return (
    <SafeAreaProvider
      style={{ backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar
          hidden={isStatusBar}
          backgroundColor={
            isNightMode ? colors.READER_STATUS_BAR_COLOR_NIGHT_MODE : colors.READER_STATUS_BAR_COLOR
          }
          barStyle={isNightMode ? "light-content" : "dark-content"}
        />

        <Header
          ref={headerRef}
          navigation={navigation}
          title={route.params.params.title}
          handleBackPress={handleBackPress}
          handleBookmarkPress={handleBookmarkPress}
          handleSettingsPress={handleSettingsPress}
        />

        {isLoading && <ActivityIndicator size="small" color={colors.READER_STATUS_BAR_COLOR} />}
        <ScrollView
          style={isHeader && styles.top50}
          ref={readerRef}
          showsVerticalScrollIndicator
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          {currentPage.map((item, index) => (
            <View
              key={item.id}
              onLayout={({ nativeEvent }) => {
                const newRowHeights = rowHeights;
                newRowHeights[index] = nativeEvent.layout.height;

                setRowHeights(newRowHeights);
              }}
            >
              <ShabadItem item={item} index={index} />
            </View>
          ))}
        </ScrollView>

        {isAutoScroll && <AutoScrollComponent shabadID={shabadID} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default Reader;
