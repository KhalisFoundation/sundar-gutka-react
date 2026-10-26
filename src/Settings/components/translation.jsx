import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  toggleEnglishTranslation,
  togglePunjabiTranslation,
  toggleSpanishTranslation,
} from "@common/actions";
import { STRINGS } from "@common";
import { Row, Sheet } from "../../common/components/ui";
import { SelectedMark } from "./comon/SelectSheet";
import SettingsRow from "./comon/SettingsRow";

// Translations is multi-select, so it uses `Sheet` directly rather than
// `SelectSheet` (which is single-choice). It previously carried its own Modal,
// BlurView and a hand-rolled orientation listener duplicating
// `useWindowDimensions`; the shared Sheet sizes itself from the live window.
const TranslationComponent = () => {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(false);

  const isEnglishTranslation = useSelector((state) => state.isEnglishTranslation);
  const isSpanishTranslation = useSelector((state) => state.isSpanishTranslation);
  const isPunjabiTranslation = useSelector((state) => state.isPunjabiTranslation);

  const options = [
    {
      key: "en",
      title: STRINGS.en_translations,
      value: isEnglishTranslation,
      action: toggleEnglishTranslation,
    },
    {
      key: "pu",
      title: STRINGS.pu_translations,
      value: isPunjabiTranslation,
      action: togglePunjabiTranslation,
    },
    {
      key: "es",
      title: STRINGS.es_translations,
      value: isSpanishTranslation,
      action: toggleSpanishTranslation,
    },
  ];

  const selectedCount = options.filter((item) => item.value).length;
  const isAllOff = selectedCount === 0;
  // Was a hardcoded English string ("N selected (multiple allowed)"), which
  // shipped untranslated to five of the six languages.
  const selectedSummary = isAllOff
    ? STRINGS.none
    : STRINGS.N_SELECTED.replace("{count}", String(selectedCount));

  const handleTurnAllOff = () => {
    if (isEnglishTranslation) dispatch(toggleEnglishTranslation(false));
    if (isPunjabiTranslation) dispatch(togglePunjabiTranslation(false));
    if (isSpanishTranslation) dispatch(toggleSpanishTranslation(false));
    setIsVisible(false);
  };

  return (
    <>
      <SettingsRow
        title={STRINGS.translations}
        value={selectedSummary}
        iconImage={require("../../../images/englishicon.png")}
        onPress={() => setIsVisible(true)}
      />

      <Sheet
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        title={STRINGS.translations}
        closeAccessibilityLabel={STRINGS.cancel}
        // Multi-select, so it cannot use SelectSheet — but it is still a
        // Settings chooser and must look like every other one.
        variant="flush"
      >
        <Row
          title={STRINGS.off}
          onPress={handleTurnAllOff}
          accessibilityRole="radio"
          accessibilityState={{ selected: isAllOff }}
          showDivider
          trailing={isAllOff ? <SelectedMark /> : null}
        />
        {options.map((item) => (
          <Row
            key={item.key}
            title={item.title}
            onPress={() => dispatch(item.action(!item.value))}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.value }}
            showDivider
            trailing={item.value ? <SelectedMark /> : null}
          />
        ))}
      </Sheet>
    </>
  );
};

export default TranslationComponent;
