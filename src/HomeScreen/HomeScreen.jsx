import React, { useEffect, useMemo } from "react";
import { Appearance, AppState, View, StatusBar } from "react-native";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
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
import useScreenAnalytics from "../common/hooks/useScreenAnalytics";
import { toggleNightMode } from "../common/actions";

const HomeScreen = React.memo(({ navigation }) => {
  const { navigate } = navigation;
  const { baniListData } = useBaniList();
  const { isNightMode } = useSelector((state) => state.isNightMode);
  const { isStatusBar } = useSelector((state) => state.isStatusBar);
  const { theme } = useSelector((state) => state.theme);
  useKeepAwake();
  useAnalytics();
  useScreenAnalytics(constant.HOME_SCREEN);
  const isAppOpenFirstTime = useAppFirstTime();
  const { baniLengthSelector } = useBaniLength();
  const dispatch = useDispatch();

  const colorScheme = useMemo(() => Appearance.getColorScheme(), []);
  const updateTheme = () => {
    if (theme === constant.Default) {
      dispatch(toggleNightMode(colorScheme === "dark"));
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        updateTheme();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [theme, colorScheme]);

  function onPress(row) {
    const bani = row.item;
    if (!bani.folder) {
      navigate(constant.READER, {
        key: `Reader-${bani.id}`,
        params: { id: bani.id, title: bani.gurmukhi },
      });
    } else {
      navigate(constant.FOLDERSCREEN, {
        key: `Folder-${bani.gurmukhi}`,
        params: { data: bani.folder, title: bani.gurmukhi },
      });
    }
  }

  return (
    <View style={[isNightMode && { backgroundColor: colors.NIGHT_BLACK }, styles.container]}>
      <StatusBar
        hidden={isStatusBar}
        barStyle="light-content"
        backgroundColor={colors.TOOLBAR_COLOR}
      />
      <BaniHeader navigate={navigate} />
      {(isAppOpenFirstTime || baniLengthSelector) && <BaniLengthSelector />}
      <BaniList data={baniListData} onPress={onPress.bind(this)} />
    </View>
  );
});

HomeScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired }).isRequired,
};

export default HomeScreen;
