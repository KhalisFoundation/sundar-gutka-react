import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import BaniList from "../common/components/BaniList/BaniList";
import useKeepAwake from "../common/hooks/keepAwake";
import colors from "../common/colors";
import styles from "./styles";
import constant from "../common/constant";
import BaniLengthSelector from "../common/components/BaniLengthSelector";
import BaniHeader from "./components/BaniHeader";
import useBaniLength from "./hooks/useBaniLength";
import useBaniList from "./hooks/useBaniList";
import useAppFirstTime from "./hooks/useAppFirstTime";
import useAnalytics from "./hooks/useAnalytics";

const HomeScreen = React.memo(({ navigation }) => {
  const { navigate } = navigation;
  const { baniListData } = useBaniList();
  const { isNightMode, isStatusBar } = useSelector((state) => state);
  useKeepAwake();
  const { baniLengthSelector } = useBaniLength();
  useAnalytics();
  const isAppOpenFirstTime = useAppFirstTime();

  function onPress(row) {
    const bani = row.item;
    if (!bani.folder) {
      navigate(constant.READER, {
        key: `Reader-${bani.id}`,
        params: { id: bani.id, title: bani.gurmukhi },
      });
    } else {
      navigate(constant.FOLDERSCREEN, {
        key: `Folder-${bani.roman}`,
        params: { data: bani.folder, title: bani.gurmukhi },
      });
    }
  }

  return (
    <SafeAreaView
      style={[isNightMode && { backgroundColor: colors.NIGHT_BLACK }, styles.container]}
    >
      <StatusBar
        hidden={isStatusBar}
        barStyle="light-content"
        backgroundColor={colors.TOOLBAR_COLOR}
      />
      <BaniHeader navigate={navigate} />
      {isAppOpenFirstTime && baniLengthSelector && <BaniLengthSelector />}
      <BaniList data={baniListData} onPress={onPress.bind(this)} />
    </SafeAreaView>
  );
});

HomeScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired }).isRequired,
};

export default HomeScreen;
