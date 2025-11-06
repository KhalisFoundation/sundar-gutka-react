import React, { useEffect } from "react";
import { BackIconComponent } from "@common/components";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS } from "@common";
import createStyles from "../styles";

const useHeader = (navigation) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { goBack } = navigation;
  const headerLeft = () => (
    <BackIconComponent
      size={30}
      handleBackPress={() => goBack()}
      color={theme.staticColors.WHITE_COLOR}
    />
  );
  useEffect(() => {
    navigation.setOptions({
      title: STRINGS.databaseUpdate,
      headerStyle: styles.headerStyle,
      headerTitleStyle: styles.headerTitleStyle,
      headerLeft,
    });
  }, []);
};
export default useHeader;
