import React, { useState, useEffect } from "react";
import { Appearance } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import { setTheme, toggleNightMode } from "../../common/actions";
import { THEMES } from "../../common/actions/constant";
import { constant } from "../../common";
import { BottomSheetComponent, ListItemComponent } from "./comon";

function ThemeComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const { theme } = useSelector((state) => state);
  const themeIcon = require("../../../images/bgcoloricon.png");
  const dispatch = useDispatch();

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
}

export default ThemeComponent;
