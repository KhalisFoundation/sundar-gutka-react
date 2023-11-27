import React, { useState } from "react";
import { useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import { setLanguage } from "../../common/actions";
import { LANGUAGES } from "../../common/actions/constant";
import { BottomSheetComponent, ListItemComponent } from "./comon";

function LanguageComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const { language } = useSelector((state) => state);
  return (
    <>
      <ListItemComponent
        icon="language"
        title={STRINGS.language}
        value={language}
        isAvatar={false}
        actionConstant={LANGUAGES}
        onPressAction={() => toggleVisible(true)}
      />
      {isVisible && (
        <BottomSheetComponent
          isVisible={isVisible}
          actionConstant={LANGUAGES}
          value={language}
          toggleVisible={toggleVisible}
          title={STRINGS.language}
          action={setLanguage}
        />
      )}
    </>
  );
}

export default LanguageComponent;
