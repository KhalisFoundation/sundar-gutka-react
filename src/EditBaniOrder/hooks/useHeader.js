import React, { useEffect } from "react";
import { Icon } from "@rneui/themed";
import colors from "../../common/colors";
import constant from "../../common/constant";

const useHeader = (navigation, setReset) => {
  const { WHITE_COLOR, TOOLBAR_COLOR_ALT2, TOOLBAR_TINT } = colors;
  const { EDIT_BANI_ORDER } = constant;
  const headerLeft = () => (
    <Icon name="arrow-back" size={30} onPress={() => navigation.goBack()} color={WHITE_COLOR} />
  );
  const headerRight = () => (
    <Icon
      name="refresh"
      color={TOOLBAR_TINT}
      size={30}
      onPress={() => {
        setReset(true);
      }}
    />
  );
  useEffect(() => {
    navigation.setOptions({
      title: EDIT_BANI_ORDER,
      headerTitleStyle: {
        color: WHITE_COLOR,
        fontWeight: "normal",
        fontSize: 18,
      },
      headerStyle: {
        backgroundColor: TOOLBAR_COLOR_ALT2,
      },
      headerLeft,
      headerRight,
    });
  }, []);
};
export default useHeader;
