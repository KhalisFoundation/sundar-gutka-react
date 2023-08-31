import React, { useEffect } from "react";
import { Icon } from "@rneui/themed";
import colors from "../../common/colors";
import constant from "../../common/constant";

const useHeader = (navigation) => {
  const { WHITE_COLOR, TOOLBAR_COLOR_ALT2 } = colors;
  const { EDIT_BANI_ORDER } = constant;
  const headerLeft = () => (
    <Icon name="arrow-back" size={30} onPress={() => navigation.goBack()} color={WHITE_COLOR} />
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
    });
  }, []);
};
export default useHeader;
