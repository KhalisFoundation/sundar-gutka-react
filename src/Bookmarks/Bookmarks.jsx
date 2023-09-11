import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import BaniList from "../common/components/BaniList/BaniList";
import { setBookmarkPosition } from "../common/actions";
import useHeader from "./hooks/useHeader";
import useBookmarks from "./hooks/useBookmarks";
import useScreenAnalytics from "../common/hooks/useScreenAnalytics";
import constant from "../common/constant";

function Bookmarks({ navigation, route }) {
  useHeader(navigation);
  const { bookmarksData } = useBookmarks(route);

  const dispatch = useDispatch();
  useScreenAnalytics(constant.BOOKMARKS);

  function onPress(item) {
    dispatch(setBookmarkPosition(item.item.shabadID));
    navigation.goBack();
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView>
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
