import React, { useEffect } from "react";
import { Icon } from "@rneui/themed";
import { useDispatch, useSelector } from "react-redux";
import { colors, STRINGS } from "@common";
import setDefaultReminders from "../utils";

const useHeader = (baniListData, navigation, selector) => {
  const dispatch = useDispatch();
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
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
            setDefaultReminders(baniListData, dispatch, isReminders, reminderSound);
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
