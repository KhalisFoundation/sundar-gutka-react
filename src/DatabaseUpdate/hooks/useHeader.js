import React, { useEffect } from "react";
import { Icon } from "@rneui/themed";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS } from "@common";
import createStyles from "../styles";

const useHeader = (navigation) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { goBack } = navigation;
  const headerLeft = () => (
    <Icon name="arrow-back" size={30} onPress={() => goBack()} color={theme.colors.primaryText} />
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
