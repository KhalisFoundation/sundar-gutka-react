import React, { useEffect } from "react";
import { BackIconComponent } from "@common/components";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS } from "@common";
import createStyles from "../styles";

const useHeader = (navigation) => {
  const { theme } = useTheme();
  const { headerTitleStyle, headerStyle } = useThemedStyles(createStyles);
  const { goBack } = navigation;
  const headerLeft = () => (
    <BackIconComponent
      size={30}
      handleBackPress={() => goBack()}
      color={theme.colors.primaryText}
    />
  );
  useEffect(() => {
    navigation.setOptions({
      title: STRINGS.Settings,
      headerTitleStyle,
      headerStyle,
      headerLeft,
    });
  }, [theme]);
};
export default useHeader;
