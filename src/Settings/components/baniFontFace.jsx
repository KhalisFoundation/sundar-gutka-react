import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { chooseBaniFontFace } from "@common/actions";
import STRINGS from "@common/localization";
import { constant, showInfoToast } from "@common";
import { BottomSheetComponent, ListItemComponent } from "./comon";
import { getBaniFontFaces } from "./comon/strings";

// The only user-facing font control. Drives the Bani (scripture) text inside the
// Reader's WebView via `baniFontFace`. The rest of the app UI (Home, Bookmarks,
// Reader header, etc.) is fixed to Baloo Paaji — see HomeScreen's fontFace reset.
const BaniFontFaceComponent = () => {
  const [isVisible, toggleVisible] = useState(false);
  const baniFontFace = useSelector((state) => state.baniFontFace);
  const prevBaniFontFaceRef = useRef(baniFontFace);

  // Baloo Paaji renders a limited Gurmukhi character set; warn when it's picked
  // for the Bani text so missing glyphs aren't a surprise.
  useEffect(() => {
    if (
      baniFontFace === constant.BALOO_PAAJI &&
      prevBaniFontFaceRef.current !== constant.BALOO_PAAJI
    ) {
      showInfoToast(STRINGS.baloo_paaji_warning);
    }
    prevBaniFontFaceRef.current = baniFontFace;
  }, [baniFontFace]);
  const fontFaceIcon = require("../../../images/fontfaceicon.png");
  const FONT_FACES = getBaniFontFaces(STRINGS);
  return (
    <>
      <ListItemComponent
        icon={fontFaceIcon.toString()}
        title={STRINGS.bani_font_face}
        value={baniFontFace}
        isAvatar
        actionConstant={FONT_FACES}
        onPressAction={() => toggleVisible(true)}
      />
      {/* Always mounted: the sheet stays rendered when closed so it can slide
          away, rather than vanishing the instant isVisible flips. */}
      <BottomSheetComponent
        isVisible={isVisible}
        // Remembered as the reader's own face, which a theme with none of its
        // own puts back when the reader leaves one that set it.
        action={chooseBaniFontFace}
        actionConstant={FONT_FACES}
        value={baniFontFace}
        toggleVisible={toggleVisible}
        title={STRINGS.bani_font_face}
      />
    </>
  );
};

export default BaniFontFaceComponent;
