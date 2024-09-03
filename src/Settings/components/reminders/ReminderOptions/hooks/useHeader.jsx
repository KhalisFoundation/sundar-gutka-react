import React, { useEffect } from "react";
import { Icon } from "@rneui/themed";
import { colors, STRINGS } from "../../../../../common";
import useDefaultReminders from "./useDefaultReminders";

const useHeader = (baniListData, navigation, selector, setStateData) => {
  const setDefaultReminders = useDefaultReminders(setStateData);
  const headerLeft = () => (
    <Icon
      name="arrow-back"
      size={30}
      onPress={() => navigation.goBack()}
      color={colors.WHITE_COLOR}
    />
  );
  const headerRight = () => {
    return (
      <>
        <Icon
          name="refresh"
          color={colors.TOOLBAR_TINT}
          style={{ marginRight: 10 }}
          size={30}
          onPress={() => {
            setDefaultReminders(baniListData);
          }}
        />
        <Icon
          name="add"
          color={colors.TOOLBAR_TINT}
          size={30}
          onPress={() => {
            selector.current.open();
          }}
        />
      </>
    );
  };
  useEffect(() => {
    navigation.setOptions({
      title: STRINGS.set_reminder_options,
      headerTitleStyle: {
        color: colors.WHITE_COLOR,
        fontWeight: "normal",
        fontSize: 18,
      },
      headerStyle: {
        backgroundColor: colors.TOOLBAR_COLOR_ALT2,
      },
      headerLeft,
      headerRight: () => (baniListData.length > 0 ? headerRight(baniListData) : null),
    });
  }, [JSON.stringify(baniListData)]);
};

export default useHeader;
