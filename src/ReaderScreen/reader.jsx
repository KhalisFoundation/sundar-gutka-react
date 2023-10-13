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
import useScreenAnalytics from "../common/hooks/useScreenAnalytics";
import useBookmarks from "./hooks/useBookmarks";
import { nightColors } from "./styles/nightMode";
import useScreenAnalytics from "../common/hooks/useScreenAnalytics";

function Reader({ navigation, route }) {
  const readerRef = useRef(null);
  const headerRef = useRef(null);
  const currentScrollPosition = useRef(0);
  const layoutHeight = useRef(0);
  const offset = useRef(0);
  const isEndReached = useRef(false);

  useScreenAnalytics(constant.READER);
  const { isNightMode, bookmarkPosition, isAutoScroll, isStatusBar } = useSelector(
    (state) => state
  );
  const [shabadID] = useState(Number(route.params.params.id));
  const [isHeader, toggleIsHeader] = useState(true);
  const [rowHeights, setRowHeights] = useState([]);
  const [itemsCount] = useState(50);
  const { title } = route.params.params;

  const [isLayout, toggleLayout] = useState(false);
  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(shabadID);
  const { currentPage, fetchScrollData } = usePagination(shabad, itemsCount);
  useSaveScroll(isLayout, currentPage, readerRef, currentScrollPosition, shabadID);
  useBookmarks(readerRef, shabad, bookmarkPosition, rowHeights, layoutHeight);
  const { backgroundColor, safeAreaViewBack } = nightColors(isNightMode);
  const { READER_STATUS_BAR_COLOR } = colors;
  const { top50 } = styles;
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
    offset.current = isEnd ? 0 : scrollPosition;
    fetchScrollData(scrollPosition, scrollViewHeight, contentHeight);
  };
  useEffect(() => {
    if (headerRef.current && headerRef.current.toggle) {
      headerRef.current.toggle(isHeader);
    }
  }, [isHeader]);

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
        <ScrollView
          style={isHeader && top50}
          ref={readerRef}
          showsVerticalScrollIndicator
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          <Pressable
            onPress={() => {
              toggleIsHeader(!isHeader);
            }}
          >
            <View
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                layoutHeight.current = height;

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

        {isAutoScroll && (
          <AutoScrollComponent shabadID={shabadID} readerRef={readerRef} offset={offset} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

Reader.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default Reader;
