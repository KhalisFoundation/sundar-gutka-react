import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { StatusBar, ActivityIndicator, FlatList } from "react-native";
import PropTypes from "prop-types";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import colors from "../common/colors";
import constant from "../common/constant";
import { setPosition } from "../common/actions";
import AutoScrollComponent from "./components/autoScrollComponent";
import Header from "./components/header";
import useFetchShabad from "./hooks/useFetchShabad";
import usePagination from "./hooks/usePagination";
import { styles } from "./styles/styles";
import useScreenAnalytics from "../common/hooks/useScreenAnalytics";
import useBookmarks from "./hooks/useBookmarks";
import { nightColors } from "./styles/nightMode";
import ShabadItem from "./components/shabadItem";

function Reader({ navigation, route }) {
  const readerRef = useRef(null);
  const headerRef = useRef(null);
  const currentScrollPosition = useRef(0);
  const isEndReached = useRef(false);
  const lastScrollY = useRef(0);

  useScreenAnalytics(constant.READER);
  const { isNightMode, isAutoScroll, isStatusBar } = useSelector((state) => state);
  const [shabadID] = useState(Number(route.params.params.id));
  const [isHeader, toggleIsHeader] = useState(true);

  const { title } = route.params.params;
  const dispatch = useDispatch();
  const { shabad, isLoading } = useFetchShabad(shabadID);
  const [itemsCount] = useState(shabad.length);
  const { currentPage } = usePagination(shabad, itemsCount);
  // useRowHeights(shabadID, currentPage);

  // useSaveScroll(isLayout, currentPage, readerRef, currentScrollPosition, shabadID);
  useBookmarks(readerRef, shabad, shabadID);
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
    toggleIsHeader(scrollPosition <= 5 || scrollPosition < lastScrollY.current);
    lastScrollY.current = scrollPosition;
    // fetchScrollData(scrollPosition, scrollViewHeight, contentHeight);
  };
  useEffect(() => {
    if (headerRef.current && headerRef.current.toggle) {
      headerRef.current.toggle(isHeader);
    }
  }, [isHeader]);

  const renderItem = ({ item, index }) => (
    <ShabadItem
      key={index}
      tuk={item}
      index={index}
      isHeader={isHeader}
      shabadID={shabadID}
      toggleIsHeader={toggleIsHeader}
    />
  );

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
          shabadID={shabadID}
          handleBackPress={handleBackPress}
          handleBookmarkPress={handleBookmarkPress}
          handleSettingsPress={handleSettingsPress}
        />

        {isLoading && <ActivityIndicator size="small" color={READER_STATUS_BAR_COLOR} />}
        {currentPage.length > 0 && (
          <FlatList
            initialNumToRender={50}
            style={[isHeader && top50, { marginLeft: 5 }]}
            onScroll={handleScroll}
            ref={readerRef}
            data={currentPage}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            windowSize={21}
          />
        )}

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
