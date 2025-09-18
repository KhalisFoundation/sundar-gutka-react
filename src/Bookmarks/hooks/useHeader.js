import React, { useEffect, useCallback } from "react";
import { Pressable } from "react-native";
import { useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import { BackArrowIcon } from "@common/icons";
import { colors } from "@common";
import { getHeaderTitleStyle, getHeaderStyle } from "../styles";

const useHeader = (navigation) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const headerTitleStyle = useCallback(getHeaderTitleStyle(isNightMode), [isNightMode]);
  const headerStyle = useCallback(getHeaderStyle(isNightMode), [isNightMode]);
  const headerLeft = () => (
    <Pressable onPress={() => navigation.goBack()}>
      <BackArrowIcon
        size={24}
        color={isNightMode ? colors.WHITE_COLOR : colors.READER_HEADER_COLOR}
      />
    </Pressable>
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
