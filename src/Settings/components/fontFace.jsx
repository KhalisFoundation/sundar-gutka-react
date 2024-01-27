import React, { useState } from "react";
import { useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import { setFontFace } from "../../common/actions";
import { FONT_FACES } from "../../common/actions/constant";
import { BottomSheetComponent, ListItemComponent } from "./comon";

function FontFaceComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const fontFace = useSelector((state) => state.fontFace);
  const fontFaceIcon = require("../../../images/fontfaceicon.png");

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
}

export default FontFaceComponent;
