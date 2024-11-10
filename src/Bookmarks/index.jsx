import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { BaniList, actions, useScreenAnalytics, constant } from "@common";
import useHeader from "./hooks/useHeader";
import useBookmarks from "./hooks/useBookmarks";
import { nightMode } from "./styles";

const Bookmarks = ({ navigation, route }) => {
  useHeader(navigation);
  const { bookmarksData } = useBookmarks(route);
  const isNightMode = useSelector((state) => state.isNightMode);
  const { backgroundColor } = nightMode(isNightMode);
  const dispatch = useDispatch();
  useScreenAnalytics(constant.BOOKMARKS);

  const onPress = (item) => {
    dispatch(actions.setBookmarkPosition(item.item.shabadID));
    navigation.goBack();
  };

  return (
    <SafeAreaProvider style={{ backgroundColor }}>
      <SafeAreaView style={{ flex: 1 }}>
        <BaniList data={bookmarksData} onPress={onPress} isFolderScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};
Bookmarks.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};
export default Bookmarks;
