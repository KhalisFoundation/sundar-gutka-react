import React, { useEffect } from "react";
import { Icon } from "@rneui/themed";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "../styles";

const useHeader = (navigation) => {
  const styles = useThemedStyles(createStyles);
  const headerLeft = () => (
    <Icon
      name="arrow-back"
      size={30}
      onPress={() => navigation.goBack()}
      color={styles.headerTitleStyle.color}
    />
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitleStyle: styles.headerTitleStyle,
      headerStyle: styles.headerStyle,
      headerLeft,
    });
  }, []);
};
export default useHeader;
