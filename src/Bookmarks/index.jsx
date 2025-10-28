import React from "react";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { HomeIcon, BookmarkIcon, SettingsIcon } from "@common/icons";
import {
  BaniList,
  actions,
  useScreenAnalytics,
  constant,
  logMessage,
  StatusBarComponent,
  SafeArea,
  BottomNavigation,
  useTheme,
} from "@common";
import useBookmarks from "./hooks/useBookmarks";
import useHeader from "./hooks/useHeader";

const Bookmarks = ({ navigation, route }) => {
  const navigationItems = [
    {
      key: "Home",
      icon: HomeIcon,
      handlePress: () => navigation.navigate("Home"),
    },
    {
      key: "Bookmarks",
      icon: BookmarkIcon,
      handlePress: () => navigation.navigate(constant.BOOKMARKS),
    },
    {
      key: "Settings",
      icon: SettingsIcon,
      handlePress: () => navigation.navigate(constant.SETTINGS),
    },
  ];
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
      <StatusBarComponent backgroundColor={theme.colors.primaryVariant} />
      <BaniList data={bookmarksData} onPress={onPress} isFolderScreen />
      <BottomNavigation navigationItems={navigationItems} activeKey="Bookmarks" />
    </SafeArea>
  );
};
Bookmarks.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};
export default Bookmarks;
