import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTransliteration, toggleTransliteration } from "@common/actions";
import { STRINGS } from "@common";
import SelectSheet from "./comon/SelectSheet";
import SettingsRow from "./comon/SettingsRow";
import { getTransliteration } from "./comon/strings";

const OFF_KEY = "OFF";

const TransliterationComponent = () => {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(false);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const isTransliteration = useSelector((state) => state.isTransliteration);

  const options = [{ key: OFF_KEY, title: STRINGS.off }, ...getTransliteration(STRINGS)];
  const selectedKey = isTransliteration ? transliterationLanguage : OFF_KEY;
  const selectedTitle = options.find((item) => item.key === selectedKey)?.title || STRINGS.off;

  const handleSelection = (key) => {
    setIsVisible(false);
    if (key === OFF_KEY) {
      dispatch(toggleTransliteration(false));
      return;
    }
    dispatch(setTransliteration(key));
    dispatch(toggleTransliteration(true));
  };

  return (
    <>
      <SettingsRow
        title={STRINGS.transliteration}
        value={selectedTitle}
        iconImage={require("../../../images/romanizeicon.png")}
        onPress={() => setIsVisible(true)}
      />
      <SelectSheet
        visible={isVisible}
        title={STRINGS.transliteration}
        options={options}
        value={selectedKey}
        onSelect={handleSelection}
        onClose={() => setIsVisible(false)}
        closeLabel={STRINGS.cancel}
      />
    </>
  );
};

export default TransliterationComponent;
