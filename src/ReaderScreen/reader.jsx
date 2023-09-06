import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, StatusBar, ScrollView, ActivityIndicator, Pressable } from "react-native";
import PropTypes from "prop-types";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import colors from "../common/colors";
import constant from "../common/constant";
import { setPosition } from "../common/actions";
import ShabadItem from "./components/shabadItem";
import AutoScrollComponent from "./components/autoScrollComponent";
import Header from "./components/header";
import useFetchShabad from "./hooks/useFetchShabad";
import usePagination from "./hooks/usePagination";
import { styles } from "./styles/styles";
import useSaveScroll from "./hooks/useSaveScroll";
import useBookmarks from "./hooks/useBookmarks";

function Reader({ navigation, route }) {
  const readerRef = useRef(null);
  const headerRef = useRef(null);
  const currentScrollPosition = useRef(0);
  const layoutHeight = useRef(0);
  const isEndReached = useRef(false);

  const { isNightMode, bookmarkPosition, isAutoScroll, isStatusBar } = useSelector(
    (state) => state
  );
  const [shabadID] = useState(Number(route.params.params.id));
  const [isHeader, toggleIsHeader] = useState(true);
  const [rowHeights, setRowHeights] = useState([]);
  const [itemsCount] = useState(50);

  const [isLayout, toggleLayout] = useState(false);
  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(shabadID);
  const { currentPage, fetchScrollData } = usePagination(shabad, itemsCount);
  useSaveScroll(isLayout, currentPage, readerRef, currentScrollPosition, shabadID);
  useBookmarks(readerRef, shabad, bookmarkPosition, rowHeights, layoutHeight);

  const handleBackPress = () => {
    let position = currentScrollPosition.current;
    if (isEndReached.current) {
      position = 0;
    }
    dispatch(setPosition(position, shabadID));
    navigation.goBack();
  };
  const handleBookmarkPress = useCallback(() => {
    navigation.navigate("Bookmarks", { id: shabadID });
  }, [navigation, shabadID]);
  const handleSettingsPress = useCallback(
    () => navigation.navigate(constant.SETTINGS),
    [navigation]
  );

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;
    const isEnd = scrollPosition + scrollViewHeight >= contentHeight - itemsCount - 500;
    isEndReached.current = isEnd;
    currentScrollPosition.current = scrollPosition;
    toggleIsHeader(scrollPosition <= 5);
    fetchScrollData(scrollPosition, scrollViewHeight, contentHeight);
  };
  useEffect(() => {
    if (headerRef.current && headerRef.current.toggle) {
      headerRef.current.toggle(isHeader);
    }
  }, [isHeader]);

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
          <Pressable onPress={() => toggleIsHeader(!isHeader)}>
            <View
              onLayout={(event) => {
                layoutHeight.current = event.nativeEvent.layout.height;

                toggleLayout(true);
              }}
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
            </View>
          </Pressable>
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
