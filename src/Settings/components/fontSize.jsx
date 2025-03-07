import React, { useState } from "react";
import { useSelector } from "react-redux";
import { STRINGS } from "@common";
import { setFontSize } from "@common/actions";
import { BottomSheetComponent, ListItemComponent } from "./comon";
import { getFontSizes } from "./comon/strings";

const FontSizeComponent = () => {
  const [isVisible, toggleVisible] = useState(false);
  const fontSize = useSelector((state) => state.fontSize);
  const fontSizeIcon = require("../../../images/fontsizeicon.png");
  const FONT_SIZES = getFontSizes(STRINGS);

  return (
    <>
      <ListItemComponent
        icon={fontSizeIcon.toString()}
        title={STRINGS.font_size}
        value={fontSize}
        isAvatar
        actionConstant={FONT_SIZES}
        onPressAction={() => toggleVisible(true)}
      />
      {isVisible && (
        <BottomSheetComponent
          isVisible={isVisible}
          actionConstant={FONT_SIZES}
          value={fontSize}
          toggleVisible={toggleVisible}
          title={STRINGS.font_size}
          action={setFontSize}
        />
      )}
    </>
  );
};

export default FontSizeComponent;
