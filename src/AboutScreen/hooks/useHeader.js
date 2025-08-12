import React, { useEffect } from "react";
import { Icon } from "@rneui/themed";
import { colors, STRINGS } from "@common";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "../styles";

const useHeader = (navigation) => {
  const { WHITE_COLOR } = colors;
  const { headerTitleStyle, headerStyle } = useThemedStyles(createStyles);
  const { goBack } = navigation;
  const headerLeft = () => (
    <Icon name="arrow-back" size={30} onPress={() => goBack()} color={WHITE_COLOR} />
  );
  useEffect(() => {
    navigation.setOptions({
      title: STRINGS.about,
      headerTitleStyle,
      headerStyle,
      headerLeft,
    });
  }, []);
};
export default useHeader;
