import React from "react";
import { StatusBar, View } from "react-native";
import PropTypes from "prop-types";
import colors from "../common/colors";
import BaniList from "../common/components/BaniList/BaniList";
import constant from "../common/constant";
import Header from "./header";

function FolderScreen({ navigation, route }) {
  const { navigate } = navigation;
  const { data, title } = route.params.params;

  const onPress = (row) => {
    const bani = row.item;
    navigate(constant.READER, {
      key: `Reader-${bani.id}`,
      params: { id: bani.id, title: bani.gurmukhi },
    });
  };
  return (
    <View>
      <StatusBar barStyle="light-content" backgroundColor={colors.TOOLBAR_COLOR} />
      <Header navigation={navigation} title={title} />
      <BaniList data={data} isFolderScreen onPress={onPress.bind(this)} />
    </View>
  );
}

FolderScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }).isRequired,

  route: PropTypes.shape({
    params: PropTypes.shape({
      params: PropTypes.shape({ data: PropTypes.arrayOf(), title: PropTypes.string }),
    }),
  }).isRequired,
};
export default FolderScreen;
