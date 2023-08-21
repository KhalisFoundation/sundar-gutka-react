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

const HomeScreen = React.memo(({ navigation }) => {
  const { navigate } = navigation;
  const { data } = useBaniList();
  const { isNightMode, isStatusBar } = useSelector((state) => state);
  useKeepAwake();
  const { baniLengthSelector } = useBaniLength();

  function onPress(row) {
    navigate(constant.READER, {
      key: `Reader-${row.item.id}`,
      params: { id: row.item.id, title: row.item.gurmukhi },
    });
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

      {baniLengthSelector && <BaniLengthSelector />}
      <BaniList data={data} onPress={onPress.bind(this)} />
    </SafeAreaView>
  );
});

HomeScreen.propTypes = {
  navigation: PropTypes.shape().isRequired,
};

export default HomeScreen;
