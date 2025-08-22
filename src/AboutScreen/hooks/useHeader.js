import { STRINGS } from "@common";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { Icon } from "@rneui/themed";
import React, { useEffect } from "react";
import useTheme from "@common/context";

import createStyles from "../styles";

const useHeader = (navigation) => {
  const { theme } = useTheme();
  const { headerTitleStyle, headerStyle } = useThemedStyles(createStyles);
  const { goBack } = navigation;
  const headerLeft = () => (
    <Icon
      name="arrow-back"
      size={30}
      onPress={() => goBack()}
      color={theme.staticColors.WHITE_COLOR}
    />
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
