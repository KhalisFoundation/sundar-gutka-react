import React, { useState } from "react";
import PropType from "prop-types";
import STRINGS from "../../common/localization";
import { setLanguage } from "../../common/actions";
import { LANGUAGES } from "../../common/actions/constant";
import { BottomSheetComponent, ListItemComponent } from "./comon";

function LanguageComponent({ language }) {
  const [isVisible, toggleVisible] = useState(false);

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
LanguageComponent.propTypes = { language: PropType.string.isRequired };

export default LanguageComponent;
