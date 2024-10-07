import React, { useState } from "react";
import PropType from "prop-types";
import { setLanguage } from "@common/actions";
import { constant, STRINGS } from "@common";
import { BottomSheetComponent, ListItemComponent } from "./comon";

function LanguageComponent({ language }) {
  const [isVisible, toggleVisible] = useState(false);
  const LANGUAGES = [
    { key: "DEFAULT", title: `${STRINGS.default}` },
    { key: "en-US", title: constant.ENGLISH_TITLE_CASE },
    { key: "es", title: constant.ESPANOL },
    { key: "fr", title: constant.FRANCAIS },
    { key: "it", title: constant.ITALIANO },
    { key: "hi", title: constant.HINDI_UNICODE },
    { key: "pa", title: constant.PUNJABI },
  ];

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
