import React, { useEffect } from "react";
import { Icon } from "@rneui/themed";
import { colors, STRINGS } from "@common";
import styles from "../styles";

const useHeader = (navigation, isNightMode) => {
  const { WHITE_COLOR, NIGHT_BLACK } = colors;
  const { goBack } = navigation;
  const { headerStyle, headerTitleStyle } = styles;
  const headerLeft = () => (
    <Icon
      name="arrow-back"
      size={30}
      onPress={() => goBack()}
      color={isNightMode ? WHITE_COLOR : NIGHT_BLACK}
    />
  );
  useEffect(() => {
    navigation.setOptions({
      title: STRINGS.databaseUpdate,
      headerStyle,
      headerTitleStyle,
      headerLeft,
    });
  }, []);
};
export default useHeader;
