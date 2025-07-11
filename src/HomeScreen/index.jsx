import React, { useEffect } from "react";
import { Appearance, AppState, View } from "react-native";
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
  logMessage,
  validateBaniOrder,
  StatusBarComponent,
  SafeArea,
} from "@common";
import styles from "./styles";
import BaniHeader from "./components/BaniHeader";
import { useBaniLength, useBaniList, useDatabaseUpdateCheck } from "./hooks";
import { setBaniOrder } from "../common/actions";

const HomeScreen = React.memo(({ navigation }) => {
  logMessage(constant.HOME_SCREEN);
  const { navigate } = navigation;
  const { baniListData } = useBaniList();
  const isNightMode = useSelector((state) => state.isNightMode);
  const language = useSelector((state) => state.language);
  const theme = useSelector((state) => state.theme);
  const baniOrder = useSelector((state) => state.baniOrder);
  useDatabaseUpdateCheck();

  useKeepAwake();
  useScreenAnalytics(constant.HOME_SCREEN);
  const { baniLengthSelector } = useBaniLength();
  const dispatch = useDispatch();

  const updateTheme = () => {
    const currentColorScheme = Appearance.getColorScheme();
    if (theme === constant.Default) {
      dispatch(actions.toggleNightMode(currentColorScheme === "dark"));
    }
  };

  useEffect(() => {
    dispatch(actions.setLanguage(language));
    const order = validateBaniOrder(baniOrder);
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
    <SafeArea
      backgroundColor={
        isNightMode ? colors.READER_STATUS_BAR_COLOR_NIGHT_MODE : colors.TOOLBAR_COLOR
      }
    >
      <View style={[isNightMode && { backgroundColor: colors.NIGHT_BLACK }, styles.container]}>
        <StatusBarComponent
          backgroundColor={
            isNightMode ? colors.READER_STATUS_BAR_COLOR_NIGHT_MODE : colors.TOOLBAR_COLOR
          }
        />
        <BaniHeader navigate={navigate} />
        <BaniList data={baniListData} onPress={onPress} />
      </View>
    </SafeArea>
  );
});

HomeScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired }).isRequired,
};

export default HomeScreen;
