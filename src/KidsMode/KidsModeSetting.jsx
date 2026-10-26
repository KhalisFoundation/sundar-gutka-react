import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BottomSheetComponent, ListItemComponent } from "@settings/components/comon";
import { SettingsSection, SettingsToggleRow } from "@settings/components/comon/SettingsRow";
import { STRINGS } from "@common";
import { DEFAULT_RECITER, RECITERS } from "./reciters";
import { setKidsReciter, setKidsScoringOptIn, toggleKidsMode } from "./state/actions";

const KidsModeSetting = () => {
  const { enabled, scoringOptIn, reciter } = useSelector((state) => state.kidsMode);
  const [isVisible, toggleVisible] = useState(false);
  const dispatch = useDispatch();
  const { KIDS_MODE, KIDS_SCORING_OPT_IN, KIDS_SCORING_OPT_IN_INFO, KIDS_RECITER } = STRINGS;
  const chosen = reciter || DEFAULT_RECITER;

  return (
    <SettingsSection title={KIDS_MODE}>
      <SettingsToggleRow
        title={KIDS_MODE}
        icon="child-care"
        value={enabled}
        onValueChange={(value) => dispatch(toggleKidsMode(value))}
      />
      {enabled && (
        <SettingsToggleRow
          title={KIDS_SCORING_OPT_IN}
          subtitle={KIDS_SCORING_OPT_IN_INFO}
          icon="cloud-upload"
          value={scoringOptIn}
          onValueChange={(value) => dispatch(setKidsScoringOptIn(value))}
        />
      )}
      {enabled && (
        <>
          <ListItemComponent
            icon="record-voice-over"
            title={KIDS_RECITER}
            value={chosen}
            isAvatar={false}
            actionConstant={RECITERS}
            onPressAction={() => toggleVisible(true)}
          />
          {/* Always mounted, like the other choosers, so the sheet can slide away when closed. */}
          <BottomSheetComponent
            isVisible={isVisible}
            action={setKidsReciter}
            actionConstant={RECITERS}
            value={chosen}
            toggleVisible={toggleVisible}
            title={KIDS_RECITER}
          />
        </>
      )}
    </SettingsSection>
  );
};

export default KidsModeSetting;
