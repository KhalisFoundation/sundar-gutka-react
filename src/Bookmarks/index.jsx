import React from "react";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import {
  BaniList,
  actions,
  useScreenAnalytics,
  constant,
  logMessage,
  StatusBarComponent,
  SafeArea,
  useTheme,
} from "@common";
import useBookmarks from "./hooks/useBookmarks";
import useHeader from "./hooks/useHeader";

const Bookmarks = ({ navigation, route }) => {
  logMessage(constant.BOOKMARKS);
  useHeader(navigation);
  const { theme } = useTheme();
  const { bookmarksData } = useBookmarks(route);
  const dispatch = useDispatch();
  useScreenAnalytics(constant.BOOKMARKS);

  const onPress = (item) => {
    dispatch(actions.setBookmarkPosition(item.item.shabadID));
    navigation.goBack();
  };

  return (
    <SafeArea backgroundColor={theme.colors.surface}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      <BaniList data={bookmarksData} onPress={onPress} isFolderScreen />
    </SafeArea>
  );
};
Bookmarks.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};
export default Bookmarks;
