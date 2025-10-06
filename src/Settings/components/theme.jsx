import React, { useState } from "react";
import { useSelector } from "react-redux";
import { setTheme } from "@common/actions";
import { STRINGS } from "@common";
import { BottomSheetComponent, ListItemComponent } from "./comon";
import { getTheme } from "./comon/strings";

const ThemeComponent = () => {
  const [isVisible, toggleVisible] = useState(false);
  const theme = useSelector((state) => state.theme);
  const themeIcon = require("../../../images/bgcoloricon.png");
  const THEMES = getTheme(STRINGS);

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
