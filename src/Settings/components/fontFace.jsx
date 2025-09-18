import React, { useState } from "react";
import { useSelector } from "react-redux";
import { setFontFace } from "@common/actions";
import STRINGS from "@common/localization";
import { BottomSheetComponent, ListItemComponent } from "./comon";
import { getFontFaces } from "./comon/strings";

const FontFaceComponent = () => {
  const [isVisible, toggleVisible] = useState(false);
  const fontFace = useSelector((state) => state.fontFace);
  const fontFaceIcon = require("../../../images/fontfaceicon.png");
  const FONT_FACES = getFontFaces(STRINGS);
  return (
    <>
      <ListItemComponent
        icon={fontFaceIcon.toString()}
        title={STRINGS.font_face}
        value={fontFace}
        isAvatar
        actionConstant={FONT_FACES}
        onPressAction={() => toggleVisible(true)}
      />
      {isVisible && (
        <BottomSheetComponent
          isVisible={isVisible}
          action={setFontFace}
          actionConstant={FONT_FACES}
          value={fontFace}
          toggleVisible={toggleVisible}
          title={STRINGS.font_face}
        />
      )}
    </>
  );
};

export default FontFaceComponent;
