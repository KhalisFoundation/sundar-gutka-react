import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { getBookmarksForID } from "../database/db";
import BaniList from "../common/components/BaniList/BanilList";
import colors from "../common/colors";
import { setBookmarkPosition } from "../common/actions";

function Bookmarks({ navigation, route }) {
  const { baniLength, transliterationLanguage, isNightMode } = useSelector((state) => state);
  const [data, setData] = useState([]);
  const dispatch = useDispatch();

  function onPress(item) {
    dispatch(setBookmarkPosition(item.item.shabadID));
    navigation.goBack();
  }

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
      headerLeft: () => (
        <Icon
          name="arrow-back"
          size={30}
          onPress={() => navigation.goBack()}
          color={colors.WHITE_COLOR}
        />
      ),
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
      try {
      } catch (error) {}
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
export default Bookmarks;
