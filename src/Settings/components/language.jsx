import React, { useState } from "react";
import PropType from "prop-types";
import { setLanguage } from "@common/actions";
import { STRINGS } from "@common";
import { BottomSheetComponent, ListItemComponent } from "./comon";
import { getLanguages } from "./comon/strings";

const LanguageComponent = ({ language }) => {
  const [isVisible, toggleVisible] = useState(false);
  const LANGUAGES = getLanguages(STRINGS);

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
};
LanguageComponent.propTypes = { language: PropType.string.isRequired };

export default LanguageComponent;
