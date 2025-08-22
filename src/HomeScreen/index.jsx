import React, { useEffect } from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  useScreenAnalytics,
  actions,
  BaniLengthSelector,
  constant,
  useKeepAwake,
  BaniList,
  logMessage,
  validateBaniOrder,
  StatusBarComponent,
  SafeArea,
} from "@common";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "./styles";
import BaniHeader from "./components/BaniHeader";
import { useBaniLength, useBaniList, useDatabaseUpdateCheck } from "./hooks";
import { setBaniOrder } from "../common/actions";

const HomeScreen = React.memo(({ navigation }) => {
  logMessage(constant.HOME_SCREEN);
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { navigate } = navigation;
  const { baniListData } = useBaniList();
  const language = useSelector((state) => state.language);
  const baniOrder = useSelector((state) => state.baniOrder);
  useDatabaseUpdateCheck();

  useKeepAwake();
  useScreenAnalytics(constant.HOME_SCREEN);
  const { baniLengthSelector } = useBaniLength();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(actions.setLanguage(language));
    const order = validateBaniOrder(baniOrder);
    dispatch(setBaniOrder(order));
  }, []);

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
    <SafeArea backgroundColor={theme.colors.primary}>
      <View style={[{ backgroundColor: theme.colors.surface }, styles.container]}>
        <StatusBarComponent backgroundColor={theme.colors.primary} />
        <BaniHeader navigate={navigate} theme={theme} />
        <BaniList theme={theme} data={baniListData} onPress={onPress} />
      </View>
    </SafeArea>
  );
});

HomeScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired }).isRequired,
};

export default HomeScreen;
