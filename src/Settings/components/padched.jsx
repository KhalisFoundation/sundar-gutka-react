import React, { useState } from "react";
import { useSelector } from "react-redux";
import { STRINGS } from "@common";
import { setPadched } from "@common/actions";
import { ListItemComponent, BottomSheetComponent } from "./comon";

function PadchedSettingsComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const padched = useSelector((state) => state.padched);
  const padchedIcon = require("../../../images/larivaaricon.png");
  const PADCHED_SETTINGS = [
    { key: "SAT_SUBHAM_SAT", title: STRINGS.sat_subham_sat_default },
    { key: "MAST_SABH_MAST", title: STRINGS.mast_sabh_mast },
  ];
  return (
    <>
      <ListItemComponent
        icon={padchedIcon.toString()}
        isAvatar
        title={STRINGS.padchhed_settings}
        value={padched}
        actionConstant={PADCHED_SETTINGS}
        onPressAction={() => toggleVisible(true)}
      />
      {isVisible && (
        <BottomSheetComponent
          isVisible={isVisible}
          actionConstant={PADCHED_SETTINGS}
          value={padched}
          toggleVisible={toggleVisible}
          title={STRINGS.padchhed_settings}
          action={setPadched}
        />
      )}
    </>
  );
}

export default PadchedSettingsComponent;
