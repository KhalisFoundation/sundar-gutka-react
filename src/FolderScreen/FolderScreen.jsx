import React from "react";
import { StatusBar, View } from "react-native";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { colors, BaniList, constant, useScreenAnalytics } from "@common";
import Header from "./header";

const FolderScreen = ({ navigation, route }) => {
  const { navigate } = navigation;
  const { data, title } = route.params.params;
  const isNightMode = useSelector((state) => state.isNightMode);
  useScreenAnalytics(constant.FOLDERSCREEN);

  const onPress = (row) => {
    const { item } = row;
    const { id, gurmukhi } = item;
    navigate(constant.READER, {
      key: `Reader-${id}`,
      params: { id, title: gurmukhi },
    });
  };
  return (
    <View
      style={{ flex: 1, backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.TOOLBAR_COLOR} />
      <Header navigation={navigation} title={title} />
      <BaniList data={data} isFolderScreen onPress={onPress} />
    </View>
  );
};

FolderScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      params: PropTypes.shape({
        data: PropTypes.arrayOf(PropTypes.shape()),
        title: PropTypes.string,
      }),
    }),
  }).isRequired,
};
export default FolderScreen;
