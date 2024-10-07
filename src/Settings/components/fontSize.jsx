import React, { useState } from "react";
import { useSelector } from "react-redux";
import { STRINGS } from "@common";
import { setFontSize } from "@common/actions";
import { BottomSheetComponent, ListItemComponent } from "./comon";

function FontSizeComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const fontSize = useSelector((state) => state.fontSize);
  const fontSizeIcon = require("../../../images/fontsizeicon.png");
  const FONT_SIZES = [
    { key: "EXTRA_SMALL", title: STRINGS.extra_small },
    { key: "SMALL", title: STRINGS.small_default },
    { key: "MEDIUM", title: STRINGS.medium },
    { key: "LARGE", title: STRINGS.large },
    { key: "EXTRA_LARGE", title: STRINGS.extra_large },
  ];
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
}

export default FontSizeComponent;
