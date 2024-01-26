import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import BaniList from "../common/components/BaniList/BaniList";
import { setBookmarkPosition } from "../common/actions";
import useScreenAnalytics from "../common/hooks/useScreenAnalytics";
import constant from "../common/constant";
import useHeader from "./hooks/useHeader";
import useBookmarks from "./hooks/useBookmarks";
import { nightMode } from "./styles";

function Bookmarks({ navigation, route }) {
  useHeader(navigation);
  const { bookmarksData } = useBookmarks(route);
  const { isNightMode } = useSelector((state) => state.isNightMode);
  const { backgroundColor } = nightMode(isNightMode);
  const dispatch = useDispatch();
  useScreenAnalytics(constant.BOOKMARKS);

  function onPress(item) {
    dispatch(setBookmarkPosition(item.item.shabadID));
    navigation.goBack();
  }

  return (
    <SafeAreaProvider style={{ backgroundColor }}>
      <SafeAreaView style={{ flex: 1 }}>
        <BaniList data={bookmarksData} onPress={onPress.bind(this)} isFolderScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
Bookmarks.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};
export default Bookmarks;
