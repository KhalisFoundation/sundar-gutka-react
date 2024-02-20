import React, { useEffect } from "react";
import { Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import colors from "../../common/colors";
import { styles, getHeaderStyle } from "../styles";

const useHeader = (navigation) => {
  const { WHITE_COLOR } = colors;
  const isNightMode = useSelector((state) => state.isNightMode);
  const { headerTitleStyle } = styles;
  const headerStyle = getHeaderStyle(isNightMode);
  const headerLeft = () => (
    <Icon name="arrow-back" size={30} onPress={() => navigation.goBack()} color={WHITE_COLOR} />
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitleStyle,
      headerStyle,
      headerLeft,
    });
  }, []);
};
export default useHeader;
