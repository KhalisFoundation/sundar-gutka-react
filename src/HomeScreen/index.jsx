import React, { useEffect, useState } from "react";
import { Appearance, AppState, View, StatusBar } from "react-native";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  useScreenAnalytics,
  actions,
  BaniLengthSelector,
  constant,
  colors,
  useKeepAwake,
  BaniList,
  defaultBaniOrder,
} from "@common";
import styles from "./styles";
import BaniHeader from "./components/BaniHeader";
import { useBaniLength, useBaniList } from "./hooks";
import errorHandler from "../common/errHandler";
import { setBaniOrder } from "../common/actions";

const HomeScreen = React.memo(({ navigation }) => {
  const [error, setError] = useState(null);
  const { navigate } = navigation;
  const { baniListData } = useBaniList(setError);
  const isNightMode = useSelector((state) => state.isNightMode);
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const language = useSelector((state) => state.language);
  const theme = useSelector((state) => state.theme);
  const baniOrder = useSelector((state) => state.baniOrder);

  useKeepAwake();
  useScreenAnalytics(constant.HOME_SCREEN);
  const { baniLengthSelector } = useBaniLength();
  const dispatch = useDispatch();

  if (error) {
    errorHandler(error);
    throw error;
  }

  const updateTheme = () => {
    const currentColorScheme = Appearance.getColorScheme();
    if (theme === constant.Default) {
      dispatch(actions.toggleNightMode(currentColorScheme === "dark"));
    }
  };
  useEffect(() => {
    dispatch(actions.setLanguage(language));
    const isValidBaniOrder =
      baniOrder != null && // checks for null or undefined
      typeof baniOrder === "object" &&
      Array.isArray(baniOrder.baniOrder) &&
      baniOrder.baniOrder.length > 0;
    const order = isValidBaniOrder ? baniOrder : defaultBaniOrder;
    dispatch(setBaniOrder(order));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        updateTheme();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [theme]);

  const onPress = (row) => {
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
  };

  return baniLengthSelector ? (
    <BaniLengthSelector />
  ) : (
    <View style={[isNightMode && { backgroundColor: colors.NIGHT_BLACK }, styles.container]}>
      <StatusBar
        hidden={isStatusBar}
        barStyle="light-content"
        backgroundColor={colors.TOOLBAR_COLOR}
      />
      <BaniHeader navigate={navigate} />
      <BaniList data={baniListData} onPress={onPress} />
    </View>
  );
});

HomeScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired }).isRequired,
};

export default HomeScreen;
