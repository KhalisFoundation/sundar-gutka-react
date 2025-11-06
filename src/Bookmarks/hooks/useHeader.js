import React, { useEffect } from "react";
import { Pressable } from "react-native";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { BackArrowIcon } from "@common/icons";
import { STRINGS } from "@common";
import createStyles from "../styles";

const useHeader = (navigation) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const headerLeft = () => (
    <Pressable onPress={() => navigation.goBack()}>
      <BackArrowIcon size={24} color={theme.colors.primaryText} />
    </Pressable>
  );

  useEffect(() => {
    navigation.setOptions({
      title: STRINGS.bookmarks,
      headerTitleStyle: styles.headerTitleStyle,
      headerStyle: styles.headerStyle,
      headerLeft,
    });
  }, []);
};
export default useHeader;
