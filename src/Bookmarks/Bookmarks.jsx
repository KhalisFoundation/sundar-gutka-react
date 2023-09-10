import React, { useState, useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { getBookmarksForID } from "../database/db";
import BaniList from "../common/components/BaniList/BaniList";
import colors from "../common/colors";
import { setBookmarkPosition } from "../common/actions";
import useScreenAnalytics from "../common/hooks/useScreenAnalytics";
import constant from "../common/constant";

function Bookmarks({ navigation, route }) {
  const { baniLength, transliterationLanguage, isNightMode } = useSelector((state) => state);
  const [data, setData] = useState([]);
  const dispatch = useDispatch();
  useScreenAnalytics(constant.BOOKMARKS);

  function onPress(item) {
    dispatch(setBookmarkPosition(item.item.shabadID));
    navigation.goBack();
  }

  const headerLeft = () => (
    <Icon
      name="arrow-back"
      size={30}
      onPress={() => navigation.goBack()}
      color={colors.WHITE_COLOR}
    />
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitleStyle: {
        color: colors.WHITE_COLOR,
        fontWeight: "normal",
        fontSize: 20,
      },
      headerStyle: {
        backgroundColor: !isNightMode
          ? colors.TOOLBAR_COLOR_ALT
          : colors.TOOLBAR_COLOR_ALT_NIGHT_MODE,
      },
      headerLeft,
    });
  }, []);

  useEffect(() => {
    (async () => {
      const bookmarks = await getBookmarksForID(
        route.params.id,
        baniLength,
        transliterationLanguage
      );
      setData(bookmarks);
    })();
  }, []);
  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <BaniList data={data} onPress={onPress.bind(this)} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
Bookmarks.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};
export default Bookmarks;
