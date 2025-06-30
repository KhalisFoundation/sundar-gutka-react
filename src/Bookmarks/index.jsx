import React from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  BaniList,
  actions,
  useScreenAnalytics,
  constant,
  logMessage,
  StatusBarComponent,
  SafeArea,
} from "@common";
import useHeader from "./hooks/useHeader";
import useBookmarks from "./hooks/useBookmarks";
import { nightMode, getHeaderStyle } from "./styles";

const Bookmarks = ({ navigation, route }) => {
  logMessage(constant.BOOKMARKS);
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
    <SafeArea backgroundColor={backgroundColor}>
      <StatusBarComponent backgroundColor={getHeaderStyle(isNightMode).backgroundColor} />
      <BaniList data={bookmarksData} onPress={onPress} isFolderScreen />
    </SafeArea>
  );
};
Bookmarks.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};
export default Bookmarks;
