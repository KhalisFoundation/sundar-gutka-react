import React, { useEffect } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import {
  actions,
  BaniLengthSelector,
  constant,
  useKeepAwake,
  BaniList,
  validateBaniOrder,
  StatusBarComponent,
  SafeArea,
  STRINGS,
} from "@common";
import { setBaniOrder } from "../common/actions";
import { getLanguages } from "../Settings/components/comon/strings";
import BaniHeader from "./components/BaniHeader";
import { useBaniLength, useBaniList, useDatabaseUpdateCheck } from "./hooks";
import createStyles from "./styles";

const HomeScreen = React.memo(({ navigation }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { navigate } = navigation;
  const { baniListData } = useBaniList();
  const language = useSelector((state) => state.language);
  const baniOrder = useSelector((state) => state.baniOrder);
  useDatabaseUpdateCheck();

  useKeepAwake();
  const { baniLengthSelector } = useBaniLength();
  const dispatch = useDispatch();

  useEffect(() => {
    const validLanguages = getLanguages(STRINGS);
    const validLanguageKeys = validLanguages.map((lang) => lang.key);
    const isLanguageValid = language && validLanguageKeys.includes(language);

    if (!language || !isLanguageValid) {
      dispatch(actions.setLanguage("DEFAULT"));
    }
    const order = validateBaniOrder(baniOrder);
    dispatch(setBaniOrder(order));
  }, []);

  const onPress = (row) => {
    const bani = row.item;
    if (!bani.folder) {
      navigate(constant.READER, {
        key: `Reader-${bani.id}`,
        params: {
          id: bani.id,
          title: bani.gurmukhi,
          titleUni: bani.gurmukhiUni,
        },
      });
    } else {
      navigate(constant.FOLDERSCREEN, {
        key: `Folder-${bani.gurmukhi}`,
        params: {
          data: bani.folder,
          title: bani.gurmukhi,
          titleUni: bani.gurmukhiUni,
        },
      });
    }
  };

  return baniLengthSelector ? (
    <BaniLengthSelector />
  ) : (
    <SafeArea backgroundColor={theme.colors.surface} edges={["bottom", "left", "right"]}>
      <StatusBarComponent backgroundColor={theme.colors.primary} />
      <View style={[{ backgroundColor: theme.colors.surface }, styles.container]}>
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
