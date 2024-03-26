import React, { useEffect, useMemo } from "react";
import { Appearance, AppState, View, StatusBar } from "react-native";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import styles from "./styles";
import BaniHeader from "./components/BaniHeader";
import { useAnalytics, useAppFirstTime, useBaniLength, useBaniList } from "./hooks";
import {
  useScreenAnalytics,
  actions,
  BaniLengthSelector,
  constant,
  colors,
  useKeepAwake,
  BaniList,
} from "../common";
import defaultBaniOrder from "../common/defaultBaniOrder";
import { setBaniOrder } from "../common/actions";

const HomeScreen = React.memo(({ navigation }) => {
  const { navigate } = navigation;
  const { baniListData } = useBaniList();
  const isNightMode = useSelector((state) => state.isNightMode);
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const theme = useSelector((state) => state.theme);
  const baniOrder = useSelector((state) => state.baniOrder);
  useKeepAwake();
  useAnalytics();
  useScreenAnalytics(constant.HOME_SCREEN);
  const isAppOpenFirstTime = useAppFirstTime();
  const { baniLengthSelector } = useBaniLength();
  const dispatch = useDispatch();

  const colorScheme = useMemo(() => Appearance.getColorScheme(), []);
  const updateTheme = () => {
    if (theme === constant.Default) {
      dispatch(actions.toggleNightMode(colorScheme === "dark"));
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
  useEffect(() => {
    if (isAppOpenFirstTime && !baniOrder.baniOrder) {
      dispatch(setBaniOrder({ baniOrder: defaultBaniOrder.baniOrder }));
    }
  }, [isAppOpenFirstTime, baniLengthSelector]);

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
