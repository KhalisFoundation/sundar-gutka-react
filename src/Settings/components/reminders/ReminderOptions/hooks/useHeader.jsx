import React, { useEffect } from "react";
import { Icon } from "@rneui/themed";
import { useDispatch, useSelector } from "react-redux";
import { STRINGS } from "@common";
import useTheme from "@common/context";
import setDefaultReminders from "../utils";

const useHeader = (baniListData, navigation, selector) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const headerLeft = () => (
    <Icon
      name="arrow-back"
      size={30}
      onPress={() => navigation.goBack()}
      color={theme.staticColors.WHITE_COLOR}
    />
  );
  const headerRight = () => {
    return (
      <>
        <Icon
          name="refresh"
          color={theme.staticColors.WHITE_COLOR}
          style={{ marginRight: 10 }}
          size={30}
          onPress={() => {
            setDefaultReminders(baniListData, dispatch, isReminders, reminderSound);
          }}
        />
        <Icon
          name="add"
          color={theme.staticColors.WHITE_COLOR}
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
        color: theme.staticColors.WHITE_COLOR,
        fontWeight: "normal",
        fontSize: 18,
      },
      headerStyle: {
        backgroundColor: theme.colors.headerVariant,
      },
      headerLeft,
      headerRight: () => (baniListData.length > 0 ? headerRight() : null),
    });
  }, [JSON.stringify(baniListData)]);
};

export default useHeader;
