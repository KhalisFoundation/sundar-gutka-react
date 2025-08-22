import React from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import {
  BaniList,
  constant,
  useScreenAnalytics,
  logMessage,
  StatusBarComponent,
  SafeArea,
} from "@common";
import Header from "./header";

const FolderScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  logMessage(constant.FOLDERSCREEN);
  const { navigate } = navigation;
  const { data, title } = route.params.params;
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
    <SafeArea backgroundColor={theme.colors.primary}>
      <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <StatusBarComponent backgroundColor={theme.colors.primary} />
        <Header navigation={navigation} title={title} />
        <BaniList data={data} isFolderScreen onPress={onPress} theme={theme} />
      </View>
    </SafeArea>
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
