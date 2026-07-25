import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import LinearGradient from "react-native-linear-gradient";
import { BaniList, actions, StatusBarComponent, SafeArea, useTheme, STRINGS } from "@common";
import { AppBar, BackIconComponent } from "@common/components";
import useBookmarks from "./hooks/useBookmarks";
import useHeader from "./hooks/useHeader";
import constant from "../common/constant";

const Bookmarks = ({ navigation, route }) => {
  useHeader(navigation);
  const { theme } = useTheme();
  const { bookmarksData } = useBookmarks(route);
  const dispatch = useDispatch();

  const fontFace = useSelector((state) => state.fontFace);
  const isBaloo = fontFace === constant.BALOO_PAAJI;

  const onPress = (item) => {
    dispatch(actions.setBookmarkPosition(item.item.shabadID));
    navigation.goBack();
  };

  const formattedData = bookmarksData?.map((item, index) => {
    const {
      gurmukhi,
      gurmukhiUni,
      tukGurmukhi,
      tukGurmukhiUni,
      translit,
      shabadID,
    } = item;

    const title = isBaloo && gurmukhiUni ? gurmukhiUni : gurmukhi;

    const subtitle =
      isBaloo && tukGurmukhiUni
        ? tukGurmukhiUni
        : tukGurmukhi || translit || "";

    return {
      ...item,
      key: (shabadID ?? index).toString(),
      gurmukhi: title,
      tukGurmukhi: subtitle,
    };
  });

  return (
    <SafeArea backgroundColor={theme.mode === "dark" ? theme.staticColors.NIGHT_BLACK : theme.colors.surface}>
      <StatusBarComponent backgroundColor={theme.mode === "dark" ? theme.staticColors.NIGHT_BLACK : theme.colors.surface} />
      <AppBar
        title={STRINGS.bookmarks}
        backgroundColor={theme.mode === "dark" ? theme.staticColors.NIGHT_BLACK : theme.colors.surface}
        titleColor={theme.mode === "dark" ? theme.staticColors.WHITE_COLOR : theme.staticColors.NIGHT_BLACK}
        titleStyle={{
          fontFamily: theme.typography.fonts.balooPaajiSemiBold,
          fontSize: theme.typography.sizes.xxl,
          fontWeight: theme.typography.weights.normal,
        }}
        leftComponent={
          <BackIconComponent size={30} color={theme.mode === "dark" ? theme.staticColors.WHITE_COLOR : theme.staticColors.NIGHT_BLACK} />
        }
      />
      <LinearGradient
        colors={["rgba(17,57,121,0)", "rgba(17,57,121,1)", "rgba(17,57,121,1)", "rgba(17,57,121,0)"]}
        locations={[0, 0.48, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: "100%", height: 1.2 }}
      />
      <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <BaniList data={formattedData} onPress={onPress} isFolderScreen />
      </View>
    </SafeArea>
  );
};

Bookmarks.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};
export default Bookmarks;
