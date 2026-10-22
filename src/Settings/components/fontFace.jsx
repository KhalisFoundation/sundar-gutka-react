import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { setFontFace } from "@common/actions";
import STRINGS from "@common/localization";
import { constant, showInfoToast } from "@common";
import { BottomSheetComponent, ListItemComponent } from "./comon";
import { getFontFaces } from "./comon/strings";

const FontFaceComponent = () => {
  const [isVisible, toggleVisible] = useState(false);
  const fontFace = useSelector((state) => state.fontFace);
  const prevFontFaceRef = useRef(fontFace);

  useEffect(() => {
    if (fontFace === constant.BALOO_PAAJI && prevFontFaceRef.current !== constant.BALOO_PAAJI) {
      showInfoToast(STRINGS.baloo_paaji_warning);
    }
    prevFontFaceRef.current = fontFace;
  }, [fontFace]);
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
      {/* Always mounted: the sheet stays rendered when closed so it can slide
          away, rather than vanishing the instant isVisible flips. */}
      <BottomSheetComponent
        isVisible={isVisible}
        action={setFontFace}
        actionConstant={FONT_FACES}
        value={fontFace}
        toggleVisible={toggleVisible}
        title={STRINGS.font_face}
      />
    </>
  );
};

export default FontFaceComponent;
