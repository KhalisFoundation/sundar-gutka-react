import React, { useState } from "react";
import { useSelector } from "react-redux";
import { STRINGS } from "../../common";
import { setPadched } from "../../common/actions";
import { PADCHED_SETTINGS } from "../../common/actions/constant";
import { ListItemComponent, BottomSheetComponent } from "./comon";

function PadchedSettingsComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const { padched } = useSelector((state) => state);
  const padchedIcon = require("../../../images/larivaaricon.png");
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
