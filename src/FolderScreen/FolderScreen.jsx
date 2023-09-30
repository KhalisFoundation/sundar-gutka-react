import React from "react";
import { StatusBar, View } from "react-native";
import PropTypes from "prop-types";
import colors from "../common/colors";
import BaniList from "../common/components/BaniList/BaniList";
import constant from "../common/constant";
import Header from "./header";
import useScreenAnalytics from "../common/hooks/useScreenAnalytics";

function FolderScreen({ navigation, route }) {
  const { navigate } = navigation;
  const { data, title } = route.params.params;
  useScreenAnalytics(constant.FOLDERSCREEN);

  const onPress = (row) => {
    const item = { row };
    const { id, gurmukhi } = item;
    navigate(constant.READER, {
      key: `Reader-${id}`,
      params: { id, title: gurmukhi },
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
