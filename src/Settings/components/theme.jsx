import React, { useState, useEffect } from "react";
import { Appearance } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setTheme, toggleNightMode } from "@common/actions";
import { constant, STRINGS } from "@common";
import { BottomSheetComponent, ListItemComponent } from "./comon";
import { getTheme } from "./comon/strings";

const ThemeComponent = () => {
  const [isVisible, toggleVisible] = useState(false);
  const theme = useSelector((state) => state.theme);
  const themeIcon = require("../../../images/bgcoloricon.png");
  const dispatch = useDispatch();
  const THEMES = getTheme(STRINGS);

  useEffect(() => {
    const colorScheme = Appearance.getColorScheme();

    switch (theme) {
      case constant.Light:
        dispatch(toggleNightMode(false));
        break;
      case constant.Dark:
        dispatch(toggleNightMode(true));
        break;
      default:
        dispatch(toggleNightMode(colorScheme !== constant.Light.toLowerCase()));
    }
  }, [theme]);

  return (
    <>
      <ListItemComponent
        icon={themeIcon.toString()}
        title={STRINGS.theme}
        value={theme}
        isAvatar
        actionConstant={THEMES}
        onPressAction={() => toggleVisible(true)}
      />
      {isVisible && (
        <BottomSheetComponent
          isVisible={isVisible}
          actionConstant={THEMES}
          value={theme}
          toggleVisible={toggleVisible}
          title={STRINGS.theme}
          action={setTheme}
        />
      )}
    </>
  );
};

export default ThemeComponent;
